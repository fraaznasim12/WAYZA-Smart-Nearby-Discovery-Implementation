package com.accessmap.repository;

import com.accessmap.entity.MediaFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA Repository for {@link MediaFile} entities.
 */
@Repository
public interface MediaFileRepository extends JpaRepository<MediaFile, UUID> {

    /** Finds all media files uploaded by a specific user. */
    List<MediaFile> findByOwnerIdOrderByUploadedAtDesc(UUID ownerId);

    /** Finds media files for a user filtered by purpose (e.g. USER_AVATAR). */
    List<MediaFile> findByOwnerIdAndPurpose(UUID ownerId, String purpose);

    /** Looks up a media file by its unique storage object key. */
    Optional<MediaFile> findByObjectKey(String objectKey);

    /** Checks whether a media file with the given object key already exists. */
    boolean existsByObjectKey(String objectKey);

    /** Finds media files associated with a specific report submission. */
    List<MediaFile> findByReportIdOrderByUploadedAtAsc(UUID reportId);
}

