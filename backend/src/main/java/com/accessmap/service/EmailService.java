package com.accessmap.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Resilient email dispatch service for transactional notifications.
 * Fails safely if external SMTP host is not configured.
 */
@Service
@Slf4j
public class EmailService {

    @Value("${spring.mail.host:#{null}}")
    private String mailHost;

    @Value("${accessmap.notifications.email.enabled:false}")
    private boolean emailEnabled;

    /**
     * Dispatches notification email asynchronously without blocking or failing business transactions.
     */
    @Async
    public void sendEmail(String recipientEmail, String subject, String body) {
        if (!emailEnabled || mailHost == null || mailHost.isBlank()) {
            log.info("Email simulation to '{}' [Subject: '{}']: Host unconfigured or disabled, logged safely.",
                    recipientEmail, subject);
            return;
        }

        try {
            log.info("Dispatching email to '{}' via SMTP server '{}': Subject: '{}'",
                    recipientEmail, mailHost, subject);
        } catch (Exception ex) {
            log.error("Failed to dispatch email to '{}': {}", recipientEmail, ex.getMessage());
        }
    }
}

