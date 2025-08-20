const fs = require('fs');
const path = require('path');

// Tạo dữ liệu test
const testData = [
    {
        searchQuery: {
            term: "9. gạch lát nền giá dưới 100k",
            url: "http://www.google.com.vn/search?q=9.+g%E1%BA%A1ch+l%C3%A1t+n%E1%BB%81n+gi%C3%A1+d%C6%B0%E1%BB%9Bi+100k&hl=vi&num=100&xmobile=1&filter=0",
            device: "MOBILE",
            page: 1,
            type: "SEARCH",
            domain: "google.com.vn",
            countryCode: "VN",
            languageCode: "vi",
            locationUule: null,
            resultsPerPage: "100"
        },
        resultsTotal: "N/A",
        relatedQueries: [],
        paidResults: [],
        paidProducts: [],
        organicResults: [
            {
                title: "Mẫu và giá Gạch lát nền 60x60 (600x600) vân ...",
                url: "https://gachgiare24h.com/san-pham/gach-lat-nen-60x60-109.c?srsltid=AfmBOooHLnobpvW1J-XKXZLcRZRrvdSpVIOG4Plns-nUPmNSGiboCgHd",
                displayedUrl: "https://gachgiare24h.com",
                description: "Gạch lát nền 60x60 Hoàng Gia ; Gạch 60x60 giá rẻ vân mây · 109.000 VNĐ · 140.000 VNĐ ; Gạch catalan 60x60 6118 · 109. ...",
                emphasizedKeywords: [],
                siteLinks: [],
                productInfo: {},
                imageData: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAMAAABF0y+mAAAA3lBMVEVHcEz////////////////////////////////////////////////////1/Pnn8+3////////////C59RauoYHqlnS697///////////8ApU8Ao0cApEz///8YrV9Bt3dzqo7J3NIee08AZStMhGEAajUAaDPHjoaqoogLc0O9fHrvEB3xMjv1qa3uFiHwJzONrYXxl5ntU1rtGySbvasAcDyNkH3sAAauzb7tPkXyxcbmfYCxSEyAh3T039+rKS+hAwquPD/VbnLqGCPTnqCkGx+iEBbq0tP16urYqqrphVNAAAAAHnRSTlMAC0OHvuj/58KEBG7O+///z3gx/////7hY8P///1pO871dAAABjUlEQVR4AVXTg7bEQBAE0Ilqbdu2bf//D73uN5NFLZN7umJhR9MN0wIcTpeuid+4PV4f4A8E/IAvGPqxsBOUSDQWi8ZBSYQ/lkyBLZ3JZjOxCCipnG05n7RsmpKV6kuqTjmXZ2PNy1nZnABbLMPIyRT8oDjdZCFQ4sViMRqTrBAeOr4ggFK5UqmUo9ysaileTeg+IFCt1Gr1cqNJs2qHKD5duHiQrdXudJvpTL7Rg4ohnDZWu/3+oDls9DsjhaZwgGrLdcJxZ0LMX0otAc60Uq/N5t3O5D/9hWqWiCVpfb5i5SzkrLAgZ2v1+sxWal4DcAgT39rtS+1s+BwJA7Z+Nfc7YwAuPgm2zmivlC424JOgeZWtt7tWnU4TN/e7eyCoCeGRtj8cT/PZbL49k114f0J8+zjBuR5v90O7fbhvx50LzSHxdbH3p/vtdufPZrD+XGyR9LE+DiSU44bN97mJUh+9n548l/y6NRNg3R6Px9ODD191qoSCPuD5arye8Hk9bvEbTXc5HYBlGp/H4Q9pkELv3anOOQAAAABJRU5ErkJggg==",
                type: "organic",
                position: 1
            },
            {
                title: "Gạch lát nền nhà trọ nhà kho size 40x40 hàng sale đủ mẫu các loại",
                url: "https://khogachmensieure.com/san-pham/gach-lat-nen-nha-tro-nha-kho-size-40x40-hang-sale-du-mau-cac-loai.html",
                displayedUrl: "https://khogachmensieure.com",
                description: "Gạch lát nền nhà trọ nhà kho size 40x40 hàng sale đủ mẫu các loại · Mã sản phẩm : DHL 0015 · Giá : 50.000 VNĐ · Mô tả: Gạch ...",
                emphasizedKeywords: [],
                siteLinks: [],
                productInfo: {},
                imageData: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAMAAABF0y+mAAAA4VBMVEX////+//////38///5///W3OlrcovT3OvS9feNws3W9/nc4utJVn4AEVI2Q2zc9/9/w9VCqsJsus0lOWwAHF17kboAPmpjrcxQutVYssfQ+foAIGEEH1tUa5iixOuRuMx+udKF1+o/T3omOHKmstKLnrhniKi93ut2mKzL9/+i4elKrMhFssz2///T2OBQXo67xdXF1easxd+ludDp6/BZYHsUK2dufJ96t8KVoseIlrWRqcqOrcKtzeDIzds6SHen1N+S0OIpW3czRnwLIla3vs1VYIRFT22lr8enrr2ip7juOqh3AAABJUlEQVR4AYwRgwHDQDCs9Ult241t7b9PbT/OPujtgV8kyEGKIBf2TyV8iQXDF/aNCYpB7w8eCqORaOytOp5IptIZQMTQN35klszlC0VQKmMvukSlWqs3mi0AiDL6pGtXOt1efzAcjSfTUmwG3zU4X1TI7nK13vSW6fF0SkRQGLp0RtFMJRdOLRJsLTGPtaaAu7jCx6gdkhdEaS315HFpSpSx+zkoKkMKkhYdDXRQLEVm8FOX2ao4GBo6AK2XTve+JinGmpMpcZgR/LQTPGel0hzIHPxg+HW2OHSZ7at+74LN0Lv1QtR8js/nVHyP8DmuzOeKcuTi1F5pJ2oOywrupt1us+2Ewzptx/NYNmEfevD9pW37tu/bS98ODm9/bB+fQ7sNLQAAHy4jaTjZilgAAAAASUVORK5CYII=",
                type: "organic",
                position: 2
            },
            {
                title: "Chỉ với hơn 100k các bác đã sở hữu ngay được gạch bậc cầu thành như ...",
                url: "https://www.facebook.com/groups/661228224566921/posts/1405272413495828/",
                displayedUrl: "2 bình luận  ·  1 năm trước",
                description: "#90*180 hàng tuyển chọn sẵn kho tại Hà Nội. #Xuất xứ: Trung Quốc #Chất liệu: hàng xương đá đồng chất chuẩn ưu. #Quy cách đóng gói: 1 viên/1 hộp ...",
                emphasizedKeywords: [],
                siteLinks: [],
                productInfo: {},
                imageData: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAA+UlEQVR4AZ2TLwyCQBTGr4GNaLTZe7F3uwHBSLCY7ZOiFWYzSi8E81VN0GUzOPPnvTnfgMch89vexo57v/eHD9WWu8JsFCJ2AxQmQDEKoN0QiXk3UTZ5ETwnwI4S+oLueAt4Ipmq/Equd9SA2CqvT0BZgZXpZiffmSddyX4Cofzaumf2pcxD2gXIb2Cd9Qc4P7RGWSJWjmX28g7WOLLuo1DiUAD6FyoAxwus2mbdgGIoYL4XntDKMYuoH9KiqNLj1axMMd00AeRO5fqY/bsDtjZ3MRDAn5BlbEnzDAGwlaOalRliqBIgK8tkFls7rZ7QNUBBvzjtS7X0BtPFWgZg70LHAAAAAElFTkSuQmCC",
                type: "organic",
                position: 3
            },
            {
                title: "Mua gạch lát nền thanh lý giá rẻ nhất 2023",
                url: "https://thegioigachtonkho.vn/mua-gach-lat-nen-thanh-ly-gia-re-nhat-2023-n118479.html",
                displayedUrl: "https://thegioigachtonkho.vn",
                description: "6 thg 4, 2023 — Gạch lát nền Thanh lý giá rẻ 60x60 giá 105.000 đồng/m2. Giá gạch lát nền thanh lý có đắt không có lẽ là câu hỏi được nhiều người tiêu dùng ...",
                emphasizedKeywords: [],
                siteLinks: [],
                productInfo: {},
                imageData: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAAulBMVEUAAAD////tycq8Mjbck5Xz2tq5KC2xERayFRruy8z03t/IVlr89va3JSn03d778/O+OT3hpKbqvr/ntLbKXWDajpD46enES0/Wg4Xw0tPUfYDvzs/79PTRdHf57O21HCHclZe0GyD35ubOaWy3Iia2HyS3Iyf67+/24+S0Gh+zGByzGB346uvUen3MYmXouLrYiIvYiYzPbG/sxsfrw8Xjq62/Oz/fnJ79+Pn14OG4JyzJWVzy19i6LTFGTa3fAAAAAXRSTlMAQObYZgAAAJ5JREFUeAFFyAMWxEAARMH5UWdt27Z1/2utk+cqYwCwbAcAfnY9+ZHfAERtSbEw4lbiFX7yHykHN/2aDNncJ/IFKJakMhU/84qqakA9rwbNlhzTVqdLF+g1SCXUNwMNR1R7wJjuRBmTmc7mLLSMA5YKGFaDCGupVITNllew23OQdIxyOn8CuExfc7XO/IPbK7w7YdR89Wt84jeFR5aPnxXqC13GoGhNAAAAAElFTkSuQmCC",
                type: "organic",
                position: 4
            },
            {
                title: "Gạch lát nền 60x60 giá bao nhiêu 1 mét. Báo giá tốt nhất",
                url: "https://happynest.vn/kho-kien-thuc/100049471/gach-lat-nen-60x60-gia-bao-nhieu-1-met-bao-gia-tot-nhat",
                displayedUrl: "https://happynest.vn",
                description: "8 thg 5, 2024 — - Gạch lát nền 60x60 giá bao nhiêu 1 mét loại men ceramic: Với loại gạch lát nền 60x60 men khô bề mặt mờ hoặc nhám giá từ 130.000-155.000đ/m2.",
                emphasizedKeywords: [],
                siteLinks: [],
                productInfo: {},
                imageData: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAJFBMVEVHcExYsONZseNYsONdtelYseRYsONZseVYsONYsONYsONYsOPJSAgPAAAAC3RSTlMATiLzBDi4EWDQlCZxo/4AAACHSURBVDiNtdPbEoMgDEXRE0q4mP//Xy1YajGJTqc9b7LXEw7AjxdqZa+zbHNE647YuylGFyElx95TsgS1UAFDjG6I3lP/6KKYXRFTB5ZPQWLsJawust/A92A5AA7nZRxAUG4f/waRyQdp3K0O2ml0QH6e5jcoNK1MQN9NcPk3wfWhz32Ft7cCNowPmDrbRVwAAAAASUVORK5CYII=",
                type: "organic",
                position: 5
            },
            {
                title: "Gạch lát sân 40x40 giá rẻ KR4803",
                url: "https://noithatnghilam.com/San-pham/Gach-lat-san-40x40-gia-re-KR4803-Loai-1-40-x-40-cm-(Thung-6-vien-=-096-m%C2%B2-)-599.html?srsltid=AfmBOoqijsSXFTgVOjA2_00M2ROPlMcpuW5PDSabGYxU1DuyWvHdrNJq",
                displayedUrl: "https://noithatnghilam.com",
                description: "Gạch lát sân 40x40 thường được sử dụng để lát nền sân vườn, lát ngoại thất, những nơi ở ngoài trời hay tiếp xúc nhiều với nắng gió ...",
                emphasizedKeywords: [],
                siteLinks: [],
                productInfo: {},
                imageData: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAMAAABF0y+mAAAApVBMVEX////+/v7P0tCss66lsKy8xcHz8e7n6eihqKRMW1AAJxUNR0F5dmTRg1r20sNZZl0cNCMAFQBbfXfXlnTwdkHwZyn5zLvU2dZgb2UOKRYAHwAtRTOxxMT4qYH3WxjxcDfway11gXtAT0TzjWRpdm/0k2rwYyE/TUQrQzNHVkzzi1/2w6/99/T98OvuXRT1t6HtfUs3Rjzqm3XtUwAVNR/35d31zrkuRiAMAAAAwUlEQVR4Aa3LBRaDMBBF0Uyouzvu7ux/aUVrgfrDueej9wOAJimuDQaYolrtTu2s2+sPhqPxhKB0Rk1n88Vytd6Qy+1ufzieaIblCOzyh5nQAySuHxFQh+/vJJy+ygqJW/WoqVsE9ahrRwG/QvFrNF4jNKNp2VkW1KAhi1nGhlw6ssytsxwXoEAsFAieIXNs3tpFN+hnGHihUxTeLI9Rv5u+xGZStolzy1CP9MzIMvSFwuCmCtvTbWb1bTE0Wbb9d2dJVRx0obz63wAAAABJRU5ErkJggg==",
                type: "organic",
                position: 6
            }
        ]
    }
];

// Lưu file hung.json
const hungPath = path.join(__dirname, 'hung.json');
fs.writeFileSync(hungPath, JSON.stringify(testData, null, 2));
console.log(`✅ File hung.json created successfully!`);
console.log(`📁 Path: ${hungPath}`);
console.log(`📊 Total URLs: ${testData.totalResults}`);

// Hiển thị nội dung
console.log('\n=== HUNG.JSON CONTENT ===');
console.log(JSON.stringify(testData, null, 2));
