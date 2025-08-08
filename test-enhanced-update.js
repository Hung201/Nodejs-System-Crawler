const axios = require('axios');

async function testEnhancedUpdate() {
    try {
        console.log('🚀 Testing enhanced campaign update logic...');

        const campaignId = '6894658410595b979c150037';
        const baseURL = 'http://localhost:5000/api/campaigns';

        // Test cases
        const tests = [
            {
                name: '1. Update only paginationPattern (partial input)',
                data: {
                    input: {
                        paginationPattern: "?page="
                    }
                }
            },
            {
                name: '2. Update multiple input fields',
                data: {
                    input: {
                        paginationPattern: "?page=",
                        pageEnd: 5,
                        maxRequestsPerCrawl: 10000
                    }
                }
            },
            {
                name: '3. Update name + input together',
                data: {
                    name: "Test Campaign - Enhanced Update",
                    input: {
                        pageStart: 1,
                        pageEnd: 3
                    }
                }
            },
            {
                name: '4. Update just campaign name',
                data: {
                    name: "DAISANB2B - Final Test"
                }
            }
        ];

        for (const test of tests) {
            console.log(`\n🧪 ${test.name}`);
            console.log('Request data:', JSON.stringify(test.data, null, 2));

            try {
                const response = await axios.put(`${baseURL}/${campaignId}`, test.data, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer YOUR_TOKEN_HERE' // Thay token thực
                    },
                    timeout: 10000
                });

                console.log('✅ Success!');
                console.log('Updated name:', response.data.data.name);

                if (response.data.data.input) {
                    console.log('Updated input keys:', Object.keys(response.data.data.input));
                    if (test.data.input) {
                        // Check if our updates were applied
                        for (const key of Object.keys(test.data.input)) {
                            console.log(`  - ${key}: ${response.data.data.input[key]}`);
                        }
                    }
                }

            } catch (error) {
                console.log('❌ Failed:', error.response?.status, error.response?.data?.error || error.message);
            }

            // Wait between tests
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Also test getting campaign to verify updates
async function verifyUpdates() {
    try {
        console.log('\n🔍 Verifying final campaign state...');

        const response = await axios.get('http://localhost:5000/api/campaigns/6894658410595b979c150037', {
            headers: {
                'Authorization': 'Bearer YOUR_TOKEN_HERE'
            }
        });

        const campaign = response.data.data;
        console.log('Final campaign name:', campaign.name);
        console.log('Final input keys:', Object.keys(campaign.input || {}));
        console.log('Campaign status:', campaign.status);

        // Show important input values
        if (campaign.input) {
            console.log('\nKey input values:');
            console.log('  - paginationPattern:', campaign.input.paginationPattern);
            console.log('  - pageStart:', campaign.input.pageStart);
            console.log('  - pageEnd:', campaign.input.pageEnd);
            console.log('  - maxRequestsPerCrawl:', campaign.input.maxRequestsPerCrawl);
        }

    } catch (error) {
        console.error('❌ Verification failed:', error.response?.data || error.message);
    }
}

// Run tests
async function runAllTests() {
    await testEnhancedUpdate();
    await verifyUpdates();
}

runAllTests();
