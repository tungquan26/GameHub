package btpoop.user.model;

import btpoop.enums.UserRole;
import jakarta.persistence.Entity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
public class Organizer extends User {
    public Organizer() {
        super();
        this.setRole(UserRole.ORGANIZER);
    }
}
