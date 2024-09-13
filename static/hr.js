const stateDropdown = document.getElementById('state');
const districtDropdown = document.getElementById('district');
const facilitiesList = document.getElementById('facilitiesList');
const facilityInput = document.getElementById('facilityInput');
const specialityList = document.getElementById('specialityList');
const specialityInput = document.getElementById('specialityInput');

// Fetch states and districts from a server or static file
document.addEventListener('DOMContentLoaded', () => {
    const statesAndDistricts = {
        "Karnataka": ["Bengaluru", "Belagavi", "Gokak", "Mysuru"],
        "Maharashtra": ["Mumbai", "Pune", "Nagpur"],
        "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai"]
    };

    Object.keys(statesAndDistricts).forEach(state => {
        const option = document.createElement('option');
        option.value = state;
        option.textContent = state;
        stateDropdown.appendChild(option);
    });

    stateDropdown.addEventListener('change', () => {
        const selectedState = stateDropdown.value;
        const districts = statesAndDistricts[selectedState] || [];

        districtDropdown.innerHTML = '<option value="all">All</option>';

        // Populate new 
        districts.forEach(district => {
            const option = document.createElement('option');
            option.value = district;
            option.textContent = district;
            districtDropdown.appendChild(option);
        });
    });
});

function addFacility() {
    const facility = facilityInput.value.trim();
    if (facility) {
        const listItem = document.createElement('li');
        listItem.textContent = facility;
        facilitiesList.appendChild(listItem);
        facilityInput.value = '';
    }
}

function addSpeciality() {
    const speciality = specialityInput.value.trim();
    if (speciality) {
        const listItem = document.createElement('li');
        listItem.textContent = speciality;
        specialityList.appendChild(listItem);
        specialityInput.value = '';
    }
}

// Register the hospital
async function registerHospital() {
    const name = document.getElementById('name').value;
    const lat = document.getElementById('lat').value;
    const lon = document.getElementById('lon').value;
    const address = document.getElementById('address').value;
    const state = document.getElementById('state').value;
    const district = document.getElementById('district').value;
    const city = document.getElementById('city').value;
    const hospital_type = document.getElementById('hospital_type').value;
    const description = document.getElementById('description').value;
    const total_beds = document.getElementById('total_beds').value;
    const total_doctors = document.getElementById('total_doctors').value;
    const total_nurses = document.getElementById('total_nurses').value;

    const facilities = Array.from(document.getElementById('facilitiesList').children).map(li => li.textContent);
    const specialities = Array.from(document.getElementById('specialityList').children).map(li => li.textContent);

    const contact_number = document.getElementById('contact_number').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/add_hospital', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name, lat, lon, address,
                location: { state, district, city },
                hospital_type, description, 
                total_beds, total_doctors, total_nurses,
                facilities, specialities,
                contact_number, email, password
            })
        });

        const result = await response.json();
        if (result.message) {
            alert('Hospital registered successfully');
            document.getElementById('hospitalForm').reset();
            document.getElementById('facilitiesList').innerHTML = '';
            document.getElementById('specialityList').innerHTML = '';
        } else {
            document.getElementById('error-message').textContent = result.error || 'Error registering hospital';
        }
    } catch (error) {
        console.error('Error registering hospital:', error);
    }
}


// Fetch coordinates from browser
function fetchCoordinates() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                document.getElementById('lat').value = position.coords.latitude;
                document.getElementById('lon').value = position.coords.longitude;
            },
            error => {
                console.error('Error fetching coordinates:', error);
                alert('Could not fetch coordinates');
            }
        );
    } else {
        alert('Geolocation is not supported by this browser.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const hospitalTypes = [
        "District Hospital",
        "General Hospital",
        "Medical College Hospital",
        "Community Health Center (CHC)",
        "Primary Health Center (PHC)",
        "Sub-District Hospital",
        "Government Teaching Hospital",
        "Specialized Government Hospital"
    ];

    const hospitalTypeDropdown = document.getElementById('hospital_type');

    hospitalTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        hospitalTypeDropdown.appendChild(option);
    });
});
