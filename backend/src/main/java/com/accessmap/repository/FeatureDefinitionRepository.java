package com.accessmap.repository;

import com.accessmap.entity.FeatureDefinition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeatureDefinitionRepository extends JpaRepository<FeatureDefinition, String> {

    List<FeatureDefinition> findAllByIsActiveTrueOrderByCategoryAscDisplayOrderAsc();

    List<FeatureDefinition> findAllByIsActiveTrueOrderByDisplayOrderAsc();
}

