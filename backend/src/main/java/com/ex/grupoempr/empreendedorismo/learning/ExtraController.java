package com.ex.grupoempr.empreendedorismo.learning;

import com.ex.grupoempr.empreendedorismo.portal.PortalAuthService;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
public class ExtraController {
    private final ExtraService service; private final PortalAuthService auth;
    public ExtraController(ExtraService service,PortalAuthService auth) { this.service=service; this.auth=auth; }
    @GetMapping("/gamification/extras") public List<Map<String,Object>> list(@RequestHeader(value="Authorization",required=false) String token) { return service.list(auth.require(token)); }
    @PostMapping("/gamification/extras") public Map<String,Object> generate(@RequestHeader(value="Authorization",required=false) String token,@RequestBody Map<String,Object> body) { return service.generate(auth.require(token),DocumentService.string(body,"policyId"),DocumentService.asId(body.get("studentId"))); }
    @PostMapping("/gamification/extras/{id}/approve") public Map<String,Object> approve(@RequestHeader(value="Authorization",required=false) String token,@PathVariable String id) { return service.approve(auth.require(token),id); }
    @GetMapping("/student/activities") public List<Map<String,Object>> activities(@RequestHeader(value="Authorization",required=false) String token) { return service.studentAssignments(auth.require(token)); }
    @PostMapping("/student/activities/{id}/questions/{questionId}/start") public Map<String,Object> start(@RequestHeader(value="Authorization",required=false) String token,@PathVariable String id,@PathVariable String questionId) { return service.start(auth.require(token),id,questionId); }
    @PostMapping("/student/activities/{id}/questions/{questionId}/answer") public Map<String,Object> answer(@RequestHeader(value="Authorization",required=false) String token,@PathVariable String id,@PathVariable String questionId,@RequestBody Map<String,Object> body) { return service.answer(auth.require(token),id,questionId,DocumentService.string(body,"optionId")); }
    @GetMapping("/student/activities/{id}/attempts") public List<Map<String,Object>> attempts(@RequestHeader(value="Authorization",required=false) String token,@PathVariable String id) { return service.attempts(auth.require(token),id); }
}
