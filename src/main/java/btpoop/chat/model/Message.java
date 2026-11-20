package btpoop.chat.model;

import btpoop.user.model.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "chat_messages", indexes = @Index(columnList = "conversation_id, id"))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Message {
    public static final int MAX_LENGTH = 2000;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @Column(nullable = false, length = MAX_LENGTH)
    private String content;

    @Column(nullable = false)
    private Instant createdAt;

    public Message(Conversation conversation, User sender, String content, Instant createdAt) {
        this.conversation = conversation;
        this.sender = sender;
        this.content = content;
        this.createdAt = createdAt;
    }
}
