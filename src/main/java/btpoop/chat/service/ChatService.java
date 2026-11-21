package btpoop.chat.service;

import btpoop.chat.model.Conversation;
import btpoop.chat.model.Message;
import btpoop.chat.repository.ConversationRepository;
import btpoop.chat.repository.MessageRepository;
import btpoop.user.model.User;
import btpoop.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatService {
    private static final int MESSAGE_PAGE_SIZE = 50;
    private static final PageRequest MESSAGE_PAGE = PageRequest.ofSize(MESSAGE_PAGE_SIZE + 1);

    private final ConversationRepository conversations;
    private final MessageRepository messages;
    private final UserRepository users;

    public List<Account> search(long userId, String username) {
        String prefix = username.strip();
        if (prefix.isEmpty() || prefix.length() > 255) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên tài khoản không hợp lệ.");
        }
        return users.findTop10ByIsVerifiedTrueAndUserIdNotAndUsernameStartingWithIgnoreCaseOrderByUsernameAsc(userId, prefix)
                .stream().map(account -> new Account(account.getUserId(), account.getUsername())).toList();
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public ConversationView open(long userId, Long recipientId) {
        if (recipientId == null || recipientId <= 0 || recipientId == userId) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Người nhận không hợp lệ.");
        }

        long firstId = Math.min(userId, recipientId);
        long secondId = Math.max(userId, recipientId);
        // Both callers lock the same row before reading the latest committed conversation.
        User first = users.findByIdForUpdate(firstId).orElse(null);
        User second = users.findById(secondId).orElse(null);
        User recipient = recipientId == firstId ? first : second;
        if (first == null || second == null || !Boolean.TRUE.equals(recipient.getIsVerified())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản.");
        }

        Conversation conversation = conversations.findByUserA_UserIdAndUserB_UserId(firstId, secondId)
                .orElseGet(() -> conversations.save(new Conversation(first, second, now())));
        return new ConversationView(conversation.getId(), recipientId, recipient.getUsername(), conversation.getUpdatedAt());
    }

    public List<ConversationView> list(long userId) {
        return conversations.findSummaries(userId).stream()
                .map(row -> new ConversationView(row.getId(), row.getRecipientId(), row.getRecipientUsername(), row.getUpdatedAt()))
                .toList();
    }

    public MessagePage history(long userId, long conversationId, Long beforeId, Long afterId) {
        if ((beforeId != null && (beforeId <= 0 || afterId != null)) || (afterId != null && afterId < 0)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mốc tin nhắn không hợp lệ.");
        }
        conversations.findMemberConversationId(conversationId, userId).orElseThrow(ChatService::missingConversation);

        List<MessageRepository.MessageRow> rows;
        if (afterId != null) {
            rows = messages.findAfter(conversationId, afterId, MESSAGE_PAGE);
        } else if (beforeId != null) {
            rows = messages.findBefore(conversationId, beforeId, MESSAGE_PAGE);
        } else {
            rows = messages.findLatest(conversationId, MESSAGE_PAGE);
        }

        boolean hasMore = rows.size() > MESSAGE_PAGE_SIZE;
        var page = hasMore ? rows.subList(0, MESSAGE_PAGE_SIZE) : rows;
        if (afterId == null) page = page.reversed();
        return new MessagePage(page.stream()
                .map(row -> new MessageView(row.getId(), row.getSenderId(), row.getContent(), row.getCreatedAt()))
                .toList(), hasMore);
    }

    @Transactional
    public MessageView send(long userId, long conversationId, String content) {
        // Serialize inserts in each conversation so polling by ID follows commit order.
        Conversation conversation = conversations.findMemberConversationForUpdate(conversationId, userId)
                .orElseThrow(ChatService::missingConversation);
        String text = content == null ? "" : content.strip();
        if (text.isBlank() || text.length() > Message.MAX_LENGTH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tin nhắn phải có từ 1 đến 2.000 ký tự.");
        }

        Instant time = now();
        var message = messages.save(new Message(conversation, users.getReferenceById(userId), text, time));
        conversation.recordActivity(time);
        return new MessageView(message.getId(), userId, message.getContent(), message.getCreatedAt());
    }

    private static Instant now() {
        return Instant.now().truncatedTo(ChronoUnit.MICROS);
    }

    private static ResponseStatusException missingConversation() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy cuộc trò chuyện.");
    }

    public record Account(long id, String username) {}
    public record ConversationView(long id, long recipientId, String recipientUsername, Instant updatedAt) {}
    public record MessageView(long id, long senderId, String content, Instant createdAt) {}
    public record MessagePage(List<MessageView> messages, boolean hasMore) {}
}
