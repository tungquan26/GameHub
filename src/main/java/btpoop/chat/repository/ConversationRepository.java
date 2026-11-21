package btpoop.chat.repository;

import btpoop.chat.model.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    Optional<Conversation> findByUserA_UserIdAndUserB_UserId(long userAId, long userBId);

    @Query("""
            select c.id as id,
                   case when a.userId = :userId then b.userId else a.userId end as recipientId,
                   case when a.userId = :userId then b.username else a.username end as recipientUsername,
                   c.updatedAt as updatedAt
            from Conversation c join c.userA a join c.userB b
            where a.userId = :userId or b.userId = :userId
            order by c.updatedAt desc, c.id desc
            """)
    List<Summary> findSummaries(long userId);

    @Query("""
            select c.id from Conversation c
            where c.id = :id and (c.userA.userId = :userId or c.userB.userId = :userId)
            """)
    Optional<Long> findMemberConversationId(long id, long userId);

    @Query(value = """
            select * from chat_conversations
            where id = :id and (user_a_id = :userId or user_b_id = :userId)
            for update
            """, nativeQuery = true)
    Optional<Conversation> findMemberConversationForUpdate(long id, long userId);

    interface Summary {
        long getId();
        long getRecipientId();
        String getRecipientUsername();
        Instant getUpdatedAt();
    }
}
