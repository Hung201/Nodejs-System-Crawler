const axios = require('axios');

async function testUpdatePagination() {
    try {
        console.log('🔍 Testing pagination pattern update...');

        // Test data - chỉ update paginationPattern
        const campaignId = '6894658410595b979c150037';
        const updateData = {
            input: {
                paginationPattern: "?page="
            }
        };

        console.log('📝 Update data:', JSON.stringify(updateData, null, 2));

        const response = await axios.put(`http://localhost:5000/api/campaigns/${campaignId}`, updateData, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer YOUR_TOKEN_HERE' // Bạn cần thay bằng token thực
            }
        });

        console.log('✅ Success!');
        console.log('Updated campaign input:', response.data.data.input);

    } catch (error) {
        console.error('❌ Error:', error.response?.status, error.response?.data || error.message);
    }
}

// Test với data khác nhau
async function testMultipleUpdates() {
    const tests = [
        {
            name: 'Update pagination pattern only',
            data: {
                input: {
                    paginationPattern: "?page="
                }
            }
        },
        {
            name: 'Update pagination and page range',
            data: {
                input: {
                    paginationPattern: "?page=",
                    pageEnd: 3
                }
            }
        },
        {
            name: 'Update name only',
            data: {
                name: "Test Campaign - Updated Name"
            }
        }
    ];

    for (const test of tests) {
        console.log(`\n🧪 ${test.name}`);
        console.log('Data:', JSON.stringify(test.data, null, 2));

        try {
            const response = await axios.put('http://localhost:5000/api/campaigns/6894658410595b979c150037', test.data, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer YOUR_TOKEN_HERE'
                }
            });
            console.log('✅ Success');
        } catch (error) {
            console.log('❌ Failed:', error.response?.data?.error || error.message);
        }
    }
}

testUpdatePagination();
