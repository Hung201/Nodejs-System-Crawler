
const unknownStyle = `
<style>
font-family: 'Segoe UI', Arial, sans-serif;
    color: #222;
    padding: 20px;
    max-width: 900px;
    margin: 0 auto;
    line-height: 1.6;
</style>
`;



export const formatContent = (content, type = 'unknown') => {
    // remove noscript, default style
    content = content.replace(/(<noscript>.*<\/noscript>)|(<style>.*<\/style>)/gi, '');
    // convert data-src to src
    content = content.replace(/src="[^"]+"\s+data-src="([^"]+)"/g, 'src="$1"');

    // Làm sạch content - loại bỏ \r\n và khoảng trắng thừa
    content = content
        .replace(/\r\n/g, '\n')  // Thay \r\n thành \n
        .replace(/\r/g, '\n')    // Thay \r thành \n
        .replace(/\n\s*\n/g, '\n')  // Loại bỏ dòng trống thừa
        .replace(/>\s+</g, '><')  // Loại bỏ khoảng trắng giữa các thẻ
        .trim();  // Loại bỏ khoảng trắng đầu cuối

    return unknownStyle + `<div class="unknown-content-root">` + content + `</div>`;
};