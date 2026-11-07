package com.accessmap.exception;

import com.accessmap.dto.ApiResponse;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.security.SignatureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import lombok.extern.slf4j.Slf4j;

import java.util.HashMap;
import java.util.Map;

/**
 * Global exception handler providing uniform JSON error response envelopes.
 *
 * <p>All exceptions caught here are translated to {@link ApiResponse} error envelopes.
 * Stack traces and internal details are never exposed to API callers.
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("RESOURCE_NOT_FOUND", ex.getMessage()));
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadRequest(BadRequestException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("BAD_REQUEST", ex.getMessage()));
    }

    @ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Void>> handleMessageNotReadable(org.springframework.http.converter.HttpMessageNotReadableException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("MALFORMED_JSON", "Request body is unreadable or malformed JSON"));
    }

    /**
     * Handles @Valid/@Validated constraint violations on request DTOs.
     * Returns a map of field names to their validation failure messages.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            errors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("VALIDATION_ERROR", "Validation failed for request fields", errors));
    }

    /**
     * Handles wrong password / credential mismatch during login.
     * Returns 401 with a generic message — does NOT reveal which field was wrong.
     */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadCredentials(BadCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("INVALID_CREDENTIALS", "Invalid email or password"));
    }

    /**
     * Handles accounts that have been disabled by an administrator.
     */
    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<ApiResponse<Void>> handleDisabled(DisabledException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("ACCOUNT_DISABLED", "This account has been disabled"));
    }

    /**
     * Handles expired JWT tokens — token was valid but has passed its expiry time.
     */
    @ExceptionHandler(ExpiredJwtException.class)
    public ResponseEntity<ApiResponse<Void>> handleExpiredJwt(ExpiredJwtException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("TOKEN_EXPIRED", "Your session has expired. Please log in again."));
    }

    /**
     * Handles malformed JWT tokens (tampered, truncated, or invalid structure).
     */
    @ExceptionHandler({MalformedJwtException.class, SignatureException.class})
    public ResponseEntity<ApiResponse<Void>> handleInvalidJwt(Exception ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("INVALID_TOKEN", "The provided token is invalid or has been tampered with."));
    }

    /**
     * Handles 403 Forbidden — authenticated but insufficient role.
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("ACCESS_DENIED", "You do not have permission to access this resource"));
    }

    /**
     * Handles ResponseStatusException (e.g. 429 TOO_MANY_REQUESTS).
     */
    @ExceptionHandler(org.springframework.web.server.ResponseStatusException.class)
    public ResponseEntity<ApiResponse<Void>> handleResponseStatusException(org.springframework.web.server.ResponseStatusException ex) {
        String code = ex.getStatusCode().toString();
        String reason = ex.getReason() != null ? ex.getReason() : ex.getMessage();
        return ResponseEntity.status(ex.getStatusCode())
                .body(ApiResponse.error(code, reason));
    }

    /**
     * Handles media upload / validation exceptions.
     */
    @ExceptionHandler(com.accessmap.service.MediaStorageService.MediaUploadException.class)
    public ResponseEntity<ApiResponse<Void>> handleMediaUpload(com.accessmap.service.MediaStorageService.MediaUploadException ex) {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                .body(ApiResponse.error("UPLOAD_ERROR", ex.getMessage()));
    }

    /**
     * Handles multipart file size limit exceptions.
     */
    @ExceptionHandler(org.springframework.web.multipart.MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiResponse<Void>> handleMaxUploadSize(org.springframework.web.multipart.MaxUploadSizeExceededException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("FILE_TOO_LARGE", "File size exceeds the maximum allowed limit"));
    }

    /**
     * Handles missing file parts in multipart requests.
     */
    @ExceptionHandler(org.springframework.web.multipart.support.MissingServletRequestPartException.class)
    public ResponseEntity<ApiResponse<Void>> handleMissingRequestPart(org.springframework.web.multipart.support.MissingServletRequestPartException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("MISSING_FILE", "Required multipart file is missing"));
    }

    /**
     * Catch-all for unexpected exceptions. Never exposes stack traces to callers.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneralException(Exception ex) {
        log.error("Unhandled exception: ", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("INTERNAL_SERVER_ERROR", "An unexpected error occurred"));
    }
}

