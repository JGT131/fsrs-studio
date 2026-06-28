export const CASE_STUDIES = [
    {
        id: "highrise-residential",
        name: "Coastal Verde Tower",
        building_type: "High-Rise Residential Condominium",
        sqft: 480000, stories: 38, location: "Miami Beach, FL",
        occupancy_hazard: "Light Hazard",
        classification: {
            occupancy_hazard: "Light Hazard",
            design_density_gpm_sqft: 0.10,
            design_area_sqft: 1500,
            k_factor: 5.6,
            confidence: 0.98,
            rationale: "SIMULATED. Multi-family residential occupancy with sleeping rooms classifies as Light Hazard per NFPA 13 §5.3. Quick-response (QR) pendent heads recommended in dwelling units. Florida high-rise re-cert (SB-4D) drives retrofit urgency for this stock."
        },
        layout: {
            bay_dimensions_ft: [80, 60, 10],
            head_count: 2400,
            main_pipe_diameter_in: 4.0,
            branch_pipe_diameter_in: 1.5,
            coverage_per_head_sqft: 200
        },
        hydraulics: {
            required_flow_gpm: 295,
            required_residual_psi: 72,
            friction_method: "Hazen-Williams",
            hazen_williams_c: 120,
            nodes: [
                {id: "BOR", p_psi: 72.0, q_gpm: 295},
                {id: "REM", p_psi: 46.1, q_gpm: 32}
            ],
            status: "PRELIMINARY · PE REVIEW REQUIRED"
        }
    },
    {
        id: "parking-garage-mechanical",
        name: "Bayfront Mechanical Garage",
        building_type: "Parking Garage / Mechanical Room",
        sqft: 95000, stories: 5, location: "Fort Lauderdale, FL",
        occupancy_hazard: "Ordinary Hazard, Group 1",
        classification: {
            occupancy_hazard: "Ordinary Hazard, Group 1",
            design_density_gpm_sqft: 0.15,
            design_area_sqft: 1500,
            k_factor: 5.6,
            confidence: 0.95,
            rationale: "SIMULATED. Open parking deck + mechanical equipment rooms — Ordinary Hazard Group 1 per NFPA 13 §5.4.1. Wet system permitted throughout. Critical infrastructure for adjacent residential condo tower."
        },
        layout: {
            bay_dimensions_ft: [60, 40, 9],
            head_count: 730,
            main_pipe_diameter_in: 4.0,
            branch_pipe_diameter_in: 1.5,
            coverage_per_head_sqft: 130
        },
        hydraulics: {
            required_flow_gpm: 360,
            required_residual_psi: 78,
            friction_method: "Hazen-Williams",
            hazen_williams_c: 120,
            nodes: [
                {id: "BOR", p_psi: 78.0, q_gpm: 360},
                {id: "REM", p_psi: 49.9, q_gpm: 40}
            ],
            status: "PRELIMINARY · PE REVIEW REQUIRED"
        }
    }
];
