
function searchByExpression() {
    const exp = document.getElementById('exp').value;
    fetch(`/search?exp=${encodeURIComponent(exp)}`)
        .then(response => response.json())
        .then(data => {     
            displayHospitalsAsTable(data)
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

function searchNearby() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                fetch(`/nearby?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`)
                    .then(response => response.json())
                    .then(data => {     
                        displayHospitalsAsTable(data)
                    })
                    .catch(error => {
                        console.error('Error:', error);
                    });
            },
            (error) => {
                console.error('Geolocation error:', error);
                alert('Unable to retrieve your location.');
            }
        );
    } else {
        alert('Geolocation is not supported by your browser.');
    }
}


function searchByLocation() {
    const state = document.getElementById('state').value;
    const district = document.getElementById('district').value;
    const city = document.getElementById('city').value;
    fetch(`/locate?state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}&city=${encodeURIComponent(city)}`)
        .then(response => response.json())
        .then(data => {
            displayHospitalsAsTable(data)
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

// Static state and district data
const stateDistrictMap = {
    "Andhra Pradesh": ["Anantapur", "Chittoor", "East Godavari", "Guntur", "Krishna"],
    "Bihar": ["Araria", "Arwal", "Aurangabad", "Banka", "Begusarai"],
    "Karnataka": ["Bagalkot", "Bangalore Rural", "Bangalore Urban", "Belagavi", "Bellary"],
    "Maharashtra": ["Ahmednagar", "Akola", "Amravati", "Aurangabad", "Beed"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul"],
    "Uttar Pradesh": ["Agra", "Aligarh", "Allahabad", "Ambedkar Nagar", "Amethi"]
};

// Populate the state dropdown
const stateSelect = document.getElementById("state");
for (let state in stateDistrictMap) {
    const option = document.createElement("option");
    option.value = state;
    option.text = state;
    stateSelect.appendChild(option);
}

// Update district dropdown based on state selection
const districtSelect = document.getElementById("district");
stateSelect.addEventListener("change", function () {
    // Clear previous district options
    districtSelect.innerHTML = '<option value="all">All</option>';
    
    const selectedState = stateSelect.value;
    if (selectedState !== 'all') {
        const districts = stateDistrictMap[selectedState];
        districts.forEach(district => {
            const option = document.createElement("option");
            option.value = district;
            option.text = district;
            districtSelect.appendChild(option);
        });
    }
});

// Search by Location function (to be implemented)
function searchByLocation() {
    const state = document.getElementById("state").value;
    const district = document.getElementById("district").value;
    const city = document.getElementById("city").value;

    // Perform the API call with the selected values
    fetch(`/locate?state=${state}&district=${district}&city=${city}`)
        .then(response => response.json())
        .then(data => {
            displayHospitalsAsTable(data)
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

function displayHospitalsAsTable(hospitals) {
    const container = document.getElementById('hospitalTableContainer');
    container.parentElement.style.display = 'flex';
    // Clear the existing table (if any)
    container.innerHTML = '';
    
    if (hospitals.length === 0) {
        container.innerHTML = '<p>No hospitals found.</p>';
        return;
    }

    // Create the table and the headers
    const table = document.createElement('table');
    table.classList.add('hospital-table'); // Add a class for styling
    
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    const headers = ['Name', 'City', 'Type'];
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create the table body
    const tbody = document.createElement('tbody');
    hospitals.forEach(hospital => {
        const row = document.createElement('tr');

        const nameCell = document.createElement('td');
        nameCell.innerHTML = `<button class="cell-btn" onclick="window.location.href = '/hospital?id=${hospital.hospital_id}';">${hospital.name}</button>`

        const cityCell = document.createElement('td');
        cityCell.textContent = hospital.location.city;

        const typeCell = document.createElement('td');
        typeCell.textContent = hospital.hospital_type;

        row.appendChild(nameCell);
        row.appendChild(cityCell);
        row.appendChild(typeCell);
        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    container.appendChild(table);
}
