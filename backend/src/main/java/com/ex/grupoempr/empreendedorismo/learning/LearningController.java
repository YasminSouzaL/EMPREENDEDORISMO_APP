package com.ex.grupoempr.empreendedorismo.learning;

import com.ex.grupoempr.empreendedorismo.portal.PortalAuthService;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
public class LearningController {
    private final DocumentService documents;
    private final PortalAuthService auth;
    public LearningController(DocumentService documents, PortalAuthService auth) { this.documents=documents; this.auth=auth; }
    @GetMapping("/learning")
    public Map<String,Object> learning(@RequestHeader(value="Authorization",required=false) String token) { return documents.read(auth.require(token),"learning"); }
    @PutMapping("/learning")
    public Map<String,Object> saveLearning(@RequestHeader(value="Authorization",required=false) String token,@RequestBody Map<String,Object> body) { return documents.save(auth.require(token),"learning",body); }
    @GetMapping("/gamification")
    public Map<String,Object> gamification(@RequestHeader(value="Authorization",required=false) String token) { return documents.read(auth.require(token),"gamification"); }
    @PutMapping("/gamification")
    public Map<String,Object> saveGamification(@RequestHeader(value="Authorization",required=false) String token,@RequestBody Map<String,Object> body) { return documents.save(auth.require(token),"gamification",body); }
}
