package daret_digital.com.controller;

import daret_digital.com.domain.User;
import daret_digital.com.repository.UtilisateurRepository;
import daret_digital.com.util.IbanValidator;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UtilisateurRepository repository;
    private final PasswordEncoder passwordEncoder;

    public UserController(UtilisateurRepository repository, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMe(Authentication authentication) {
        return repository.findByEmail(authentication.getName())
                .<ResponseEntity<?>>map(u -> ResponseEntity.ok(toResponse(u)))
                .orElseGet(() -> ResponseEntity.status(404).body("Utilisateur introuvable"));
    }

    @PatchMapping("/me")
    public ResponseEntity<?> updateMe(Authentication authentication,
                                      @RequestBody UpdateProfileRequest request) {
        User user = repository.findByEmail(authentication.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body("Utilisateur introuvable");
        }

        if (request.firstname() == null || request.firstname().isBlank()
                || request.lastname() == null || request.lastname().isBlank()) {
            return ResponseEntity.badRequest().body("Prenom et nom obligatoires");
        }

        // Empty IBAN is allowed (-> null). A filled one must be a valid IBAN; it is stored without spaces, uppercase.
        String iban = IbanValidator.normalize(request.iban());
        if (iban != null && !IbanValidator.isValid(iban)) {
            return ResponseEntity.badRequest().body("IBAN invalide. Verifiez le numero saisi.");
        }

        // L'email n'est pas modifiable ici : il sert de subject dans le JWT.
        user.setFirstname(request.firstname().trim());
        user.setLastname(request.lastname().trim());
        user.setPhone(blankToNull(request.phone()));
        user.setIban(iban);

        repository.save(user);
        return ResponseEntity.ok(toResponse(user));
    }

    @PatchMapping("/me/password")
    public ResponseEntity<?> changePassword(Authentication authentication,
                                            @RequestBody ChangePasswordRequest request) {
        User user = repository.findByEmail(authentication.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body("Utilisateur introuvable");
        }

        if (request.currentPassword() == null
                || !passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            return ResponseEntity.badRequest().body("Mot de passe actuel incorrect");
        }
        if (request.newPassword() == null || request.newPassword().length() < 8) {
            return ResponseEntity.badRequest().body("Le nouveau mot de passe doit contenir au moins 8 caracteres");
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        repository.save(user);
        return ResponseEntity.noContent().build();
    }

    private static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }

    private static UserProfileResponse toResponse(User u) {
        return new UserProfileResponse(
                u.getId().toString(),
                u.getFirstname(),
                u.getLastname(),
                u.getEmail(),
                u.getPhone(),
                u.getIban()
        );
    }
}

record UserProfileResponse(String id, String firstname, String lastname, String email, String phone, String iban) {}
record UpdateProfileRequest(String firstname, String lastname, String email, String phone, String iban) {}
record ChangePasswordRequest(String currentPassword, String newPassword) {}