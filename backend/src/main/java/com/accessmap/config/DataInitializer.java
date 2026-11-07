package com.accessmap.config;

import com.accessmap.entity.*;
import com.accessmap.repository.PlaceRepository;
import com.accessmap.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.ArrayList;

/**
 * Initializes realistic sample places and an admin account for local development
 * when running with the "dev" profile (in-memory database).
 */
@Component
@Profile("dev")
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final PlaceRepository placeRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

    @Override
    public void run(String... args) {
        if (userRepository.count() == 0) {
            log.info("Seeding default demo users for local dev profile...");
            userRepository.save(User.builder()
                    .email("admin@accessmap.local")
                    .passwordHash(passwordEncoder.encode("AdminPass123!"))
                    .fullName("Default Admin")
                    .role(UserRole.ROLE_ADMIN)
                    .isEnabled(true)
                    .build());
            userRepository.save(User.builder()
                    .email("user@accessmap.local")
                    .passwordHash(passwordEncoder.encode("UserPass123!"))
                    .fullName("Demo User")
                    .role(UserRole.ROLE_USER)
                    .isEnabled(true)
                    .build());
        }

        if (placeRepository.count() == 0) {
            log.info("Seeding realistic venues for local dev profile...");
            createSeedPlace("City Central Hospital", "Emergency medical care, ICU facilities, and accessible parking.",
                    "HOSPITAL", "1 Hospital Road, Central District", "Metro City", "Maharashtra", "400001", "India",
                    19.0760, 72.8777, "+91 22 2345 6789", "https://hospital.accessmap.local");

            createSeedPlace("Metropolitan University — Main Campus", "Undergraduate and graduate campus with pedestrian pathways.",
                    "COLLEGE", "450 University Avenue, Academic Quarter", "Metro City", "Maharashtra", "400098", "India",
                    19.0820, 72.8856, "+91 22 2654 3210", "https://university.accessmap.local");

            createSeedPlace("Central Railway Terminal", "Multi-platform commuter terminal with tactile guidance tiles.",
                    "TRANSIT_STATION", "1 Station Plaza, Downtown", "Metro City", "Maharashtra", "400001", "India",
                    18.9402, 72.8347, "+91 22 2262 0123", "https://railway.accessmap.local");

            createSeedPlace("City Civic Centre & District Offices", "Municipal administration complex with citizen service counters.",
                    "PUBLIC_OFFICE", "100 Administrative Boulevard, Government Quarter", "Metro City", "Maharashtra", "400051", "India",
                    19.0570, 72.8650, "+91 22 2456 7890", "https://civic.accessmap.local");

            createSeedPlace("Grand Metro Shopping Mall", "Multi-level retail and entertainment center with sensory quiet rooms.",
                    "SHOPPING_MALL", "88 Commerce Ring Road, Shopping District", "Metro City", "Maharashtra", "400070", "India",
                    19.0680, 72.8900, "+91 22 6123 4567", "https://grandmall.accessmap.local");

            createSeedPlace("Metro Central Library", "Public library with accessible workstations and audio collection.",
                    "LIBRARY", "12 Knowledge Circle, Civic Center", "Metro City", "Maharashtra", "400001", "India",
                    19.0735, 72.8720, "+91 22 2288 9900", "https://library.accessmap.local");

            createSeedPlace("Greenfield Botanical Gardens", "Paved garden trails, sensory herb gardens, and resting benches.",
                    "PARK", "45 Garden Boulevard, Green Valley", "Metro City", "Maharashtra", "400050", "India",
                    19.0620, 72.8610, "+91 22 2640 1122", "https://gardens.accessmap.local");

            createSeedPlace("The Artisan Roastery & Cafe", "Specialty coffee shop and community workspace with ground-level entry.",
                    "CAFE", "88 High Street, Bandra West", "Metro City", "Maharashtra", "400050", "India",
                    19.0580, 72.8360, "+91 22 2645 7788", "https://artisancafe.accessmap.local");

            createSeedPlace("National Performing Arts Theater", "Modern acoustic concert hall with designated wheelchair spaces.",
                    "THEATER", "200 Marine Drive, Nariman Point", "Metro City", "Maharashtra", "400021", "India",
                    18.9280, 72.8220, "+91 22 2282 4950", "https://npa.accessmap.local");

            createSeedPlace("Apex Super-Specialty Medical Clinic", "Specialist consultation clinics with automated entrance doors.",
                    "HOSPITAL", "500 Ring Road, Andheri East", "Metro City", "Maharashtra", "400069", "India",
                    19.1130, 72.8680, "+91 22 2830 5500", "https://apexclinic.accessmap.local");

            createSeedPlace("Connaught Heritage Pavilion", "Historic commercial arcade with wide paved colonnades and restaurants.",
                    "RETAIL", "Inner Circle, Connaught Place", "New Delhi", "Delhi", "110001", "India",
                    28.6328, 77.2197, "+91 11 2334 1234", "https://connaught.accessmap.local");

            createSeedPlace("Indira Gandhi Memorial Transit Terminal", "High-capacity transit interchange with step-free elevators.",
                    "TRANSIT_STATION", "Airport Express Corridor", "New Delhi", "Delhi", "110037", "India",
                    28.5562, 77.0860, "+91 11 2565 5678", "https://delhitransit.accessmap.local");
            log.info("Seeded 12 demo places successfully.");
        }
    }

    private void createSeedPlace(String name, String desc, String category, String address, String city,
                                 String state, String postalCode, String country, double lat, double lng,
                                 String phone, String website) {
        Point point = geometryFactory.createPoint(new Coordinate(lng, lat));

        Place place = Place.builder()
                .name(name)
                .description(desc)
                .category(category)
                .address(address)
                .city(city)
                .state(state)
                .postalCode(postalCode)
                .country(country)
                .geom(point)
                .phone(phone)
                .website(website)
                .isActive(true)
                .features(new ArrayList<>())
                .build();

        // Seed 4-state accessibility features in UNKNOWN state (Rule 8: Missing data is UNKNOWN)
        for (FeatureType type : FeatureType.values()) {
            AccessibilityFeature feature = AccessibilityFeature.builder()
                    .place(place)
                    .featureType(type)
                    .status(FeatureStatus.UNKNOWN)
                    .build();
            place.getFeatures().add(feature);
        }

        placeRepository.save(place);
    }
}

