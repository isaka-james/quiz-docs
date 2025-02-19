const https = require('https');

const debug = false;

// Function to perform an HTTPS GET request
function fetchPage(url, callback) {
    const options = {
        hostname: url.hostname,
        port: 443, // Use 443 for HTTPS
        path: url.path,
        method: 'GET',
        protocol: 'https:',
        rejectUnauthorized: false, // 🔥 Ignore SSL certificate errors
        headers: {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
        },
    };

    const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            callback(null, data);
        });
    });

    req.on('error', (err) => {
        callback(err);
    });

    req.end();
}

// Fetch the main page
fetchPage({ hostname: 'quiz.ct.ws', path: '/' }, (err, html) => {
    if (err) {
        if (debug) {
            console.error('Error fetching the page:', err);
        }
        process.exit(1);
    }

    // Extract the JavaScript functions and variables
    const scriptContentMatch = html.match(/<script>function toNumbers\(d\)\{(.*?)\}function toHex\(\)\{(.*?)\}var a=toNumbers\("([^"]+)"\),b=toNumbers\("([^"]+)"\),c=toNumbers\("([^"]+)"\);/s);

    if (scriptContentMatch) {
        const toNumbersCode = scriptContentMatch[1].trim();
        const toHexCode = scriptContentMatch[2].trim();
        const aHex = scriptContentMatch[3];
        const bHex = scriptContentMatch[4];
        const cHex = scriptContentMatch[5];

        if (debug) {
            console.log('toNumbers Code:', toNumbersCode);
            console.log('toHex Code:', toHexCode);
            console.log('a:', aHex);
            console.log('b:', bHex);
            console.log('c:', cHex);
        }

        // Execute the toNumbers function and convert hex to numbers
        const toNumbers = new Function('d', toNumbersCode + '; return toNumbers(d);');
        const a = toNumbers(aHex);
        const b = toNumbers(bHex);
        const c = toNumbers(cHex);

        if (debug) {
            console.log('Converted Values:');
            console.log('a:', a);
            console.log('b:', b);
            console.log('c:', c);
        }

        // Fetch the aes.js file
        fetchPage({ hostname: 'quiz.ct.ws', path: '/aes.js' }, (err, aesJs) => {
            if (err) {
                if (debug) {
                    console.error('Error fetching aes.js:', err);
                }
                process.exit(1);
            }

            // Evaluate the aes.js code to define slowAES
            eval(aesJs); // This will define slowAES in the current scope

            // Now, call slowAES.decrypt(c, 2, a, b)
            const decryptedValue = slowAES.decrypt(c, 2, a, b); // Now slowAES should be defined

            // Define the toHex function within this scope
            function toHex() {
                for (var d = [], d = 1 == arguments.length && arguments[0].constructor == Array ? arguments[0] : arguments, e = "", f = 0; f < d.length; f++)
                    e += (16 > d[f] ? "0" : "") + d[f].toString(16);
                return e.toLowerCase();
            }

            // Convert the decrypted value to hex
            const hexValue = toHex(decryptedValue);

            console.log(hexValue);
        });
    } else {
        if (debug) {
            console.error('Failed to find script content in the HTML.');
        }
        process.exit(1);
    }
});


