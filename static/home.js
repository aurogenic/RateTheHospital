// JavaScript to create the bar graph
const ctx = document.getElementById('hospitalRatingsChart').getContext('2d');
const hospitalRatingsChart = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: [
            'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 
            'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 
            'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 
            'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 
            'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 
            'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 
            'Andaman and Nicobar', 'Chandigarh', 'Dadra and Nagar Haveli', 
            'Daman and Diu', 'Lakshadweep', 'Delhi', 'Puducherry'
        ],
        datasets: [{
            label: 'Average Hospital Rating',
            data: [
                3.9, 3.5, 3.7, 3.2, 3.6, 
                4.0, 4.2, 3.8, 3.9, 3.4, 
                4.9, 4.3, 3.5, 4.0, 3.7, 
                3.6, 3.8, 3.4, 3.9, 4.0, 
                3.7, 3.9, 4.1, 3.8, 3.4, 
                3.5, 3.2, 3.9, 3.7, 3.6, 
                4.2, 4.0, 3.8, 3.9, 3.5
            ],
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
        }]
    },
    options: {
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Rating (out of 5)'
                }
            },
            x: {
                title: {
                    display: true,
                    text: 'States and Union Territories'
                }
            }
        },
        plugins: {
            tooltip: {
                callbacks: {
                    label: function(tooltipItem) {
                        return {Rating: `${tooltipItem.raw}`};
                    }
                }
            }
        },
        responsive: true,
        maintainAspectRatio: false
    }
});
