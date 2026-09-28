package btpoop.user.model;

import btpoop.enums.UserRole;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
public class Player extends User {

    @Embedded
    private PlayerStats stats = new PlayerStats();

    public Player() {
        super();
        this.setRole(UserRole.PLAYER);
    }
}
