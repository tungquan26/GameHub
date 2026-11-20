package btpoop.chat.controller;

import btpoop.chat.service.ChatService;
import btpoop.chat.service.ChatService.Account;
import btpoop.chat.service.ChatService.ConversationView;
import btpoop.chat.service.ChatService.MessagePage;
import btpoop.chat.service.ChatService.MessageView;
import btpoop.user.controller.SessionUser;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {
    private final ChatService chat;

    @GetMapping("/users")
    public ResponseEntity<List<Account>> search(@RequestParam String username, HttpSession session) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(chat.search(SessionUser.id(session), username));
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationView>> list(HttpSession session) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(chat.list(SessionUser.id(session)));
    }

    @PostMapping("/conversations")
    public ConversationView open(@RequestBody OpenConversation body, HttpSession session) {
        return chat.open(SessionUser.id(session), body.recipientId());
    }

    @GetMapping("/conversations/{id}/messages")
    public ResponseEntity<MessagePage> history(@PathVariable long id, @RequestParam(required = false) Long beforeId,
                                               @RequestParam(required = false) Long afterId, HttpSession session) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .body(chat.history(SessionUser.id(session), id, beforeId, afterId));
    }

    @PostMapping("/conversations/{id}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public MessageView send(@PathVariable long id, @RequestBody SendMessage body, HttpSession session) {
        return chat.send(SessionUser.id(session), id, body.content());
    }

    public record OpenConversation(Long recipientId) {}
    public record SendMessage(String content) {}
}
