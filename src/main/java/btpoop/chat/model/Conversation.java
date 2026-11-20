package btpoop.chat.model;

import btpoop.user.model.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "chat_conversations",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_a_id", "user_b_id"}),
        indexes = @Index(columnList = "user_b_id"))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Conversation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_a_id", nullable = false)
    private User userA;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_b_id", nullable = false)
    private User userB;

    @Column(nullable = false)
    private Instant updatedAt;

    public Conversation(User userA, User userB, Instant updatedAt) {
        this.userA = userA;
        this.userB = userB;
        this.updatedAt = updatedAt;
    }

    public void recordActivity(Instant time) {
        updatedAt = time;
    }
}
