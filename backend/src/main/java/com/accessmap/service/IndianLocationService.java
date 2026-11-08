package com.accessmap.service;

import com.accessmap.dto.location.CityDto;
import com.accessmap.dto.location.DistrictDto;
import com.accessmap.dto.location.LocationSuggestionDto;
import com.accessmap.dto.location.StateDto;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Authoritative Indian Administrative Directory service providing:
 * - All 36 Indian States & Union Territories
 * - Cascading State -> District -> City/Town hierarchy
 * - High-speed debounced location autocomplete with state/district disambiguation
 * Strictly maintains local dataset to prevent unpermitted high-volume Nominatim requests.
 */
@Service
public class IndianLocationService {

    private record AdminLocation(
            String cityName,
            String districtName,
            String stateName,
            double latitude,
            double longitude
    ) {}

    // Complete official 36 States & UTs of the Republic of India
    private static final List<StateDto> ALL_STATES_AND_UTS = List.of(
            // 28 States
            new StateDto("AP", "Andhra Pradesh", "STATE"),
            new StateDto("AR", "Arunachal Pradesh", "STATE"),
            new StateDto("AS", "Assam", "STATE"),
            new StateDto("BR", "Bihar", "STATE"),
            new StateDto("CG", "Chhattisgarh", "STATE"),
            new StateDto("GA", "Goa", "STATE"),
            new StateDto("GJ", "Gujarat", "STATE"),
            new StateDto("HR", "Haryana", "STATE"),
            new StateDto("HP", "Himachal Pradesh", "STATE"),
            new StateDto("JH", "Jharkhand", "STATE"),
            new StateDto("KA", "Karnataka", "STATE"),
            new StateDto("KL", "Kerala", "STATE"),
            new StateDto("MP", "Madhya Pradesh", "STATE"),
            new StateDto("MH", "Maharashtra", "STATE"),
            new StateDto("MN", "Manipur", "STATE"),
            new StateDto("ML", "Meghalaya", "STATE"),
            new StateDto("MZ", "Mizoram", "STATE"),
            new StateDto("NL", "Nagaland", "STATE"),
            new StateDto("OD", "Odisha", "STATE"),
            new StateDto("PB", "Punjab", "STATE"),
            new StateDto("RJ", "Rajasthan", "STATE"),
            new StateDto("SK", "Sikkim", "STATE"),
            new StateDto("TN", "Tamil Nadu", "STATE"),
            new StateDto("TS", "Telangana", "STATE"),
            new StateDto("TR", "Tripura", "STATE"),
            new StateDto("UP", "Uttar Pradesh", "STATE"),
            new StateDto("UK", "Uttarakhand", "STATE"),
            new StateDto("WB", "West Bengal", "STATE"),
            // 8 Union Territories
            new StateDto("AN", "Andaman and Nicobar Islands", "UNION_TERRITORY"),
            new StateDto("CH", "Chandigarh", "UNION_TERRITORY"),
            new StateDto("DH", "Dadra and Nagar Haveli and Daman and Diu", "UNION_TERRITORY"),
            new StateDto("DL", "Delhi", "UNION_TERRITORY"),
            new StateDto("JK", "Jammu and Kashmir", "UNION_TERRITORY"),
            new StateDto("LA", "Ladakh", "UNION_TERRITORY"),
            new StateDto("LD", "Lakshadweep", "UNION_TERRITORY"),
            new StateDto("PY", "Puducherry", "UNION_TERRITORY")
    );

    // Seeded official administrative directory with major urban centres and district headquarters
    private static final List<AdminLocation> CITIES_DIRECTORY = List.of(
            // Jharkhand
            new AdminLocation("Ranchi", "Ranchi", "Jharkhand", 23.3441, 85.3096),
            new AdminLocation("Jamshedpur", "East Singhbhum", "Jharkhand", 22.8046, 86.2029),
            new AdminLocation("Dhanbad", "Dhanbad", "Jharkhand", 23.7957, 86.4304),
            new AdminLocation("Bokaro Steel City", "Bokaro", "Jharkhand", 23.6693, 86.1511),
            new AdminLocation("Deoghar", "Deoghar", "Jharkhand", 24.4826, 86.7002),
            new AdminLocation("Hazaribagh", "Hazaribagh", "Jharkhand", 23.9925, 85.3637),
            new AdminLocation("Giridih", "Giridih", "Jharkhand", 24.1904, 86.3006),
            new AdminLocation("Ramgarh", "Ramgarh", "Jharkhand", 23.6268, 85.5146),

            // Maharashtra
            new AdminLocation("Mumbai", "Mumbai Suburban", "Maharashtra", 19.0760, 72.8777),
            new AdminLocation("Pune", "Pune", "Maharashtra", 18.5204, 73.8567),
            new AdminLocation("Nagpur", "Nagpur", "Maharashtra", 21.1458, 79.0882),
            new AdminLocation("Thane", "Thane", "Maharashtra", 19.2183, 72.9781),
            new AdminLocation("Nashik", "Nashik", "Maharashtra", 19.9975, 73.7898),
            new AdminLocation("Chhatrapati Sambhajinagar", "Aurangabad", "Maharashtra", 19.8762, 75.3433),
            new AdminLocation("Solapur", "Solapur", "Maharashtra", 17.6599, 75.9064),
            new AdminLocation("Amravati", "Amravati", "Maharashtra", 20.9374, 77.7796),
            new AdminLocation("Kolhapur", "Kolhapur", "Maharashtra", 16.7050, 74.2433),
            new AdminLocation("Navi Mumbai", "Thane", "Maharashtra", 19.0330, 73.0297),

            // Delhi (NCT)
            new AdminLocation("New Delhi", "New Delhi", "Delhi", 28.6139, 77.2090),
            new AdminLocation("Central Delhi", "Central Delhi", "Delhi", 28.6448, 77.2167),
            new AdminLocation("South Delhi", "South Delhi", "Delhi", 28.5355, 77.2100),
            new AdminLocation("Dwarka", "South West Delhi", "Delhi", 28.5921, 77.0460),
            new AdminLocation("Connaught Place", "New Delhi", "Delhi", 28.6315, 77.2167),

            // Karnataka
            new AdminLocation("Bengaluru", "Bengaluru Urban", "Karnataka", 12.9716, 77.5946),
            new AdminLocation("Mysuru", "Mysuru", "Karnataka", 12.2958, 76.6394),
            new AdminLocation("Hubballi-Dharwad", "Dharwad", "Karnataka", 15.3647, 75.1240),
            new AdminLocation("Mangaluru", "Dakshina Kannada", "Karnataka", 12.9141, 74.8560),
            new AdminLocation("Belagavi", "Belagavi", "Karnataka", 15.8497, 74.4977),
            new AdminLocation("Kalaburagi", "Kalaburagi", "Karnataka", 17.3297, 76.8343),

            // Tamil Nadu
            new AdminLocation("Chennai", "Chennai", "Tamil Nadu", 13.0827, 80.2707),
            new AdminLocation("Coimbatore", "Coimbatore", "Tamil Nadu", 11.0168, 76.9558),
            new AdminLocation("Madurai", "Madurai", "Tamil Nadu", 9.9252, 78.1198),
            new AdminLocation("Tiruchirappalli", "Tiruchirappalli", "Tamil Nadu", 10.7905, 78.7047),
            new AdminLocation("Salem", "Salem", "Tamil Nadu", 11.6643, 78.1460),
            new AdminLocation("Vellore", "Vellore", "Tamil Nadu", 12.9165, 79.1325),

            // Uttar Pradesh
            new AdminLocation("Lucknow", "Lucknow", "Uttar Pradesh", 26.8467, 80.9462),
            new AdminLocation("Kanpur", "Kanpur Nagar", "Uttar Pradesh", 26.4499, 80.3319),
            new AdminLocation("Varanasi", "Varanasi", "Uttar Pradesh", 25.3176, 82.9739),
            new AdminLocation("Prayagraj", "Prayagraj", "Uttar Pradesh", 25.4358, 81.8463),
            new AdminLocation("Agra", "Agra", "Uttar Pradesh", 27.1767, 78.0081),
            new AdminLocation("Noida", "Gautam Buddha Nagar", "Uttar Pradesh", 28.5355, 77.3910),
            new AdminLocation("Ghaziabad", "Ghaziabad", "Uttar Pradesh", 28.6692, 77.4538),
            new AdminLocation("Meerut", "Meerut", "Uttar Pradesh", 28.9845, 77.7064),

            // West Bengal
            new AdminLocation("Kolkata", "Kolkata", "West Bengal", 22.5726, 88.3639),
            new AdminLocation("Howrah", "Howrah", "West Bengal", 22.5958, 88.2636),
            new AdminLocation("Durgapur", "Paschim Bardhaman", "West Bengal", 23.5204, 87.3119),
            new AdminLocation("Asansol", "Paschim Bardhaman", "West Bengal", 23.6739, 86.9524),
            new AdminLocation("Siliguri", "Darjeeling", "West Bengal", 26.7271, 88.3953),
            new AdminLocation("Darjeeling", "Darjeeling", "West Bengal", 27.0410, 88.2663),

            // Gujarat
            new AdminLocation("Ahmedabad", "Ahmedabad", "Gujarat", 23.0225, 72.5714),
            new AdminLocation("Surat", "Surat", "Gujarat", 21.1702, 72.8311),
            new AdminLocation("Vadodara", "Vadodara", "Gujarat", 22.3072, 73.1812),
            new AdminLocation("Rajkot", "Rajkot", "Gujarat", 22.3039, 70.8022),
            new AdminLocation("Gandhinagar", "Gandhinagar", "Gujarat", 23.2156, 72.6369),

            // Rajasthan
            new AdminLocation("Jaipur", "Jaipur", "Rajasthan", 26.9124, 75.7873),
            new AdminLocation("Jodhpur", "Jodhpur", "Rajasthan", 26.2389, 73.0243),
            new AdminLocation("Udaipur", "Udaipur", "Rajasthan", 24.5854, 73.7125),
            new AdminLocation("Kota", "Kota", "Rajasthan", 25.2138, 75.8648),
            new AdminLocation("Ajmer", "Ajmer", "Rajasthan", 26.4499, 74.6399),
            new AdminLocation("Bikaner", "Bikaner", "Rajasthan", 28.0229, 73.3119),

            // Bihar
            new AdminLocation("Patna", "Patna", "Bihar", 25.5941, 85.1376),
            new AdminLocation("Gaya", "Gaya", "Bihar", 24.7914, 85.0002),
            new AdminLocation("Bhagalpur", "Bhagalpur", "Bihar", 25.2425, 86.9842),
            new AdminLocation("Muzaffarpur", "Muzaffarpur", "Bihar", 26.1209, 85.3647),
            new AdminLocation("Darbhanga", "Darbhanga", "Bihar", 26.1542, 85.8918),

            // Kerala
            new AdminLocation("Thiruvananthapuram", "Thiruvananthapuram", "Kerala", 8.5241, 76.9366),
            new AdminLocation("Kochi", "Ernakulam", "Kerala", 9.9312, 76.2673),
            new AdminLocation("Kozhikode", "Kozhikode", "Kerala", 11.2588, 75.7804),
            new AdminLocation("Thrissur", "Thrissur", "Kerala", 10.5276, 76.2144),

            // Telangana
            new AdminLocation("Hyderabad", "Hyderabad", "Telangana", 17.3850, 78.4867),
            new AdminLocation("Warangal", "Warangal", "Telangana", 17.9689, 79.5941),
            new AdminLocation("Nizamabad", "Nizamabad", "Telangana", 18.6725, 78.0941),

            // Andhra Pradesh
            new AdminLocation("Visakhapatnam", "Visakhapatnam", "Andhra Pradesh", 17.6868, 83.2185),
            new AdminLocation("Vijayawada", "NTR", "Andhra Pradesh", 16.5062, 80.6480),
            new AdminLocation("Guntur", "Guntur", "Andhra Pradesh", 16.3067, 80.4365),
            new AdminLocation("Tirupati", "Tirupati", "Andhra Pradesh", 13.6288, 79.4192),

            // Madhya Pradesh
            new AdminLocation("Bhopal", "Bhopal", "Madhya Pradesh", 23.2599, 77.4126),
            new AdminLocation("Indore", "Indore", "Madhya Pradesh", 22.7196, 75.8577),
            new AdminLocation("Gwalior", "Gwalior", "Madhya Pradesh", 26.2183, 78.1828),
            new AdminLocation("Jabalpur", "Jabalpur", "Madhya Pradesh", 23.1815, 79.9864),
            new AdminLocation("Ujjain", "Ujjain", "Madhya Pradesh", 23.1765, 75.7885),

            // Punjab
            new AdminLocation("Amritsar", "Amritsar", "Punjab", 31.6340, 74.8723),
            new AdminLocation("Ludhiana", "Ludhiana", "Punjab", 30.9010, 75.8573),
            new AdminLocation("Jalandhar", "Jalandhar", "Punjab", 31.3260, 75.5762),
            new AdminLocation("Patiala", "Patiala", "Punjab", 30.3398, 76.3869),

            // Haryana
            new AdminLocation("Gurugram", "Gurugram", "Haryana", 28.4595, 77.0266),
            new AdminLocation("Faridabad", "Faridabad", "Haryana", 28.4089, 77.3178),
            new AdminLocation("Panipat", "Panipat", "Haryana", 29.3909, 76.9635),
            new AdminLocation("Ambala", "Ambala", "Haryana", 30.3782, 76.7767),

            // Odisha
            new AdminLocation("Bhubaneswar", "Khordha", "Odisha", 20.2961, 85.8245),
            new AdminLocation("Cuttack", "Cuttack", "Odisha", 20.4625, 85.8828),
            new AdminLocation("Rourkela", "Sundargarh", "Odisha", 22.2604, 84.8536),
            new AdminLocation("Puri", "Puri", "Odisha", 19.8135, 85.8312),

            // Assam
            new AdminLocation("Guwahati", "Kamrup Metropolitan", "Assam", 26.1445, 91.7362),
            new AdminLocation("Silchar", "Cachar", "Assam", 24.8333, 92.7789),
            new AdminLocation("Dibrugarh", "Dibrugarh", "Assam", 27.4728, 94.9120),

            // Jammu and Kashmir
            new AdminLocation("Srinagar", "Srinagar", "Jammu and Kashmir", 34.0837, 74.7973),
            new AdminLocation("Jammu", "Jammu", "Jammu and Kashmir", 32.7266, 74.8570),

            // Uttarakhand
            new AdminLocation("Dehradun", "Dehradun", "Uttarakhand", 30.3165, 78.0322),
            new AdminLocation("Haridwar", "Haridwar", "Uttarakhand", 29.9457, 78.1642),
            new AdminLocation("Rishikesh", "Dehradun", "Uttarakhand", 30.0869, 78.2676),

            // Himachal Pradesh
            new AdminLocation("Shimla", "Shimla", "Himachal Pradesh", 31.1048, 77.1734),
            new AdminLocation("Dharamshala", "Kangra", "Himachal Pradesh", 32.2190, 76.3234),

            // Goa
            new AdminLocation("Panaji", "North Goa", "Goa", 15.4909, 73.8278),
            new AdminLocation("Margao", "South Goa", "Goa", 15.2832, 73.9862),

            // Chhattisgarh
            new AdminLocation("Raipur", "Raipur", "Chhattisgarh", 21.2514, 81.6296),
            new AdminLocation("Bhilai", "Durg", "Chhattisgarh", 21.1938, 81.3509),

            // Union Territories
            new AdminLocation("Chandigarh", "Chandigarh", "Chandigarh", 30.7333, 76.7794),
            new AdminLocation("Puducherry", "Puducherry", "Puducherry", 11.9416, 79.8083),
            new AdminLocation("Port Blair", "South Andaman", "Andaman and Nicobar Islands", 11.6234, 92.7265),
            new AdminLocation("Leh", "Leh", "Ladakh", 34.1526, 77.5771),
            new AdminLocation("Kargil", "Kargil", "Ladakh", 34.5539, 76.1349)
    );

    public List<StateDto> getAllStates() {
        return ALL_STATES_AND_UTS;
    }

    public List<DistrictDto> getDistrictsByState(String stateName) {
        if (stateName == null || stateName.isBlank()) {
            return List.of();
        }
        String clean = stateName.trim();
        return CITIES_DIRECTORY.stream()
                .filter(c -> c.stateName().equalsIgnoreCase(clean))
                .map(AdminLocation::districtName)
                .distinct()
                .sorted()
                .map(d -> new DistrictDto(d, clean))
                .collect(Collectors.toList());
    }

    public List<CityDto> getCities(String stateName, String districtName) {
        return CITIES_DIRECTORY.stream()
                .filter(c -> stateName == null || c.stateName().equalsIgnoreCase(stateName.trim()))
                .filter(c -> districtName == null || c.districtName().equalsIgnoreCase(districtName.trim()))
                .map(c -> new CityDto(c.cityName(), c.districtName(), c.stateName(), c.latitude(), c.longitude()))
                .sorted(Comparator.comparing(CityDto::name))
                .collect(Collectors.toList());
    }

    /**
     * Autocomplete suggestion generator matching States, Districts, and Cities.
     * Generates clear disambiguation labels like "Jamshedpur (East Singhbhum, Jharkhand)".
     */
    public List<LocationSuggestionDto> suggestLocations(String query, int limit) {
        if (query == null || query.trim().length() < 1) {
            return List.of();
        }
        String clean = query.trim().toLowerCase();
        int max = limit > 0 ? Math.min(limit, 25) : 10;
        List<LocationSuggestionDto> results = new ArrayList<>();

        // 1. Check matching States / UTs
        for (StateDto s : ALL_STATES_AND_UTS) {
            if (s.name().toLowerCase().contains(clean)) {
                results.add(new LocationSuggestionDto(
                        s.name() + " (" + (s.type().equals("STATE") ? "State" : "Union Territory") + ")",
                        s.name(),
                        "STATE",
                        null,
                        s.name(),
                        null,
                        null
                ));
            }
        }

        // 2. Check matching Cities / Towns (with state and district disambiguation)
        List<LocationSuggestionDto> cityMatches = CITIES_DIRECTORY.stream()
                .filter(c -> c.cityName().toLowerCase().contains(clean) || c.districtName().toLowerCase().contains(clean))
                .sorted((a, b) -> {
                    boolean aStarts = a.cityName().toLowerCase().startsWith(clean);
                    boolean bStarts = b.cityName().toLowerCase().startsWith(clean);
                    if (aStarts && !bStarts) return -1;
                    if (!aStarts && bStarts) return 1;
                    return a.cityName().compareToIgnoreCase(b.cityName());
                })
                .map(c -> new LocationSuggestionDto(
                        c.cityName() + " (" + c.districtName() + ", " + c.stateName() + ")",
                        c.cityName(),
                        "CITY",
                        c.districtName(),
                        c.stateName(),
                        c.latitude(),
                        c.longitude()
                ))
                .limit(max)
                .collect(Collectors.toList());

        results.addAll(cityMatches);

        return results.stream().limit(max).collect(Collectors.toList());
    }
}

