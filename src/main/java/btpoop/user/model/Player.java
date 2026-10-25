package btpoop.user.model;

import btpoop.enums.UserRole;
import btpoop.statistics.model.PlayerStats;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
public class Player extends User {

    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "stats_id")
    private PlayerStats stats = new PlayerStats();

    public Player() {
        super();
        this.setRole(UserRole.PLAYER);
    }
}
