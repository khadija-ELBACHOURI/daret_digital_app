package daret_digital.com.controller;

import daret_digital.com.domain.User;
import daret_digital.com.repository.UtilisateurRepository;
import daret_digital.com.service.JwtService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UtilisateurRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthController(UtilisateurRepository repository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (request.nom() == null || request.nom().isBlank()) {
            return ResponseEntity.badRequest().body("Le nom est obligatoire");
        }
        if (repository.findByEmail(request.email()).isPresent()) {
            return ResponseEntity.badRequest().body("Email deja utilise");
        }

        // "nom" is the full name typed at registration: first word = firstname,
        // the rest = lastname (empty string if only one word, the column is NOT NULL).
        String fullName = request.nom().trim().replaceAll("\\s+", " ");
        int space = fullName.indexOf(' ');
        String firstname = space == -1 ? fullName : fullName.substring(0, space);
        String lastname = space == -1 ? "" : fullName.substring(space + 1);

        User user = new User();
        user.setEmail(request.email());
        user.setFirstname(firstname);
        user.setLastname(lastname);
        user.setPassword(passwordEncoder.encode(request.motDePasse()));

        repository.save(user);

        String token = jwtService.generateToken(user);
        return ResponseEntity.ok(new AuthResponse(token, user.getId().toString(), user.getEmail()));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        User user = repository.findByEmail(request.email())
                .orElseThrow(() -> new BadCredentialsException("Identifiants invalides"));

        if (!passwordEncoder.matches(request.motDePasse(), user.getPassword())) {
            throw new BadCredentialsException("Identifiants invalides");
        }

        String token = jwtService.generateToken(user);
        return ResponseEntity.ok(new AuthResponse(token, user.getId().toString(), user.getEmail()));
    }
}

record RegisterRequest(String email, String motDePasse, String nom) {}
record LoginRequest(String email, String motDePasse) {}
record AuthResponse(String token, String userId, String email) {}