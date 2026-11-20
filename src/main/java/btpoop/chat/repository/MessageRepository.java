package btpoop.chat.repository;

import btpoop.chat.model.Message;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    String SELECT_MESSAGES = """
            select m.id as id, m.sender.userId as senderId, m.content as content, m.createdAt as createdAt
            from Message m where m.conversation.id = :conversationId
            """;

    @Query(SELECT_MESSAGES + "order by m.id desc")
    List<MessageRow> findLatest(long conversationId, Pageable page);

    @Query(SELECT_MESSAGES + "and m.id < :beforeId order by m.id desc")
    List<MessageRow> findBefore(long conversationId, long beforeId, Pageable page);

    @Query(SELECT_MESSAGES + "and m.id > :afterId order by m.id asc")
    List<MessageRow> findAfter(long conversationId, long afterId, Pageable page);

    interface MessageRow {
        long getId();
        long getSenderId();
        String getContent();
        Instant getCreatedAt();
    }
}
