const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 4030;


app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));




app.post('/submit', (req, res) => {
    const steps = parseInt(req.body.steps);
    if (isNaN(steps) || steps < 1 || steps > 50) {
        res.send('Invalid input. Please enter a number between 1 and 50.');
        return;
    }

    let table = '<table>';
    for (let i = 1; i <= steps; i++) {
        table += '<tr>';
        for (let j = 1; j <= i; j++) {
            table += `<td>${j}</td>`;
        }
        table += '</tr>';
    }
    table += '</table>';

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Steps Draw</title>
            <style>
                table {
                    border-collapse: collapse;
                }
                td {
                    border: 1px solid #ccc;
                    padding: 10px;
                    text-align: center;
                }
            </style>
        </head>
        <body>
            ${table}
        </body>
        </html>
    `);
});

// Define route for form submission from form2.html
app.post('/submit-text', (req, res) => {
    const textInput = req.body.text;

    // Generate HTML for 12 lines of text with random colors and increasing font sizes
    let linesHTML = '';
    for (let i = 0; i < 12; i++) {
        const randomColor = `rgb(${getRandomInt(256)}, ${getRandomInt(256)}, ${getRandomInt(256)})`;
        const fontSize = `${i + 1}em`; // Font size increases with each line
        linesHTML += `<div style="color: ${randomColor}; font-size: ${fontSize};">${textInput}</div>`;
    }

    // Send the HTML for the lines as the response
    res.send(linesHTML);
});

// Function to generate a random integer between 0 and max
function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}


//form3
// Setup multer for file storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

app.post('/submit-album', upload.single('imageFile'), (req, res) => {
    const clearImages = req.body.clearImages === 'on';

    // Directory where images are stored
    const imgDir = path.join(__dirname, 'public', 'images');
    if (!fs.existsSync(imgDir)) {
        fs.mkdirSync(imgDir, { recursive: true });
    }

    // Clear previous images if requested
    if (clearImages) {
        fs.readdir(imgDir, (err, files) => {
            if (err) {
                console.error('Failed to read directory for deletion:', err);
                return res.status(500).send('Server error when trying to clear images.');
            }
            for (const file of files) {
                fs.unlink(path.join(imgDir, file), err => {
                    if (err) {
                        console.error('Failed to delete file:', err);
                        return res.status(500).send('Server error when trying to delete images.');
                    }
                });
            }
        });
    }

    // Check if a file is uploaded and is an image
    if (!req.file) {
        return res.status(400).send('No image file uploaded.');
    }
    if (!req.file.mimetype.startsWith('image')) {
        return res.status(400).send('Only image files are allowed.');
    }

    // Move the file to 'public/images'
    const newFilePath = path.join(imgDir, req.file.filename);
    fs.rename(req.file.path, newFilePath, (err) => {
        if (err) {
            console.error('Failed to move file:', err);
            return res.status(500).send('Failed to save image.');
        }

        // Display the uploaded image and any others
        fs.readdir(imgDir, (err, files) => {
            if (err) {
                console.error('Failed to read directory:', err);
                return res.status(500).send('Server error when trying to display images.');
            }
            let imagesHTML = files.map(file => `<img src="images/${file}" style="width: 70%;">`).join('');
            res.send(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Uploaded Image</title>
                </head>
                <body>
                    ${imagesHTML}
                </body>
                </html>
            `);
        });
    });
});

// Define route for form submission from form4.html
// Define route for form submission
app.post('/submit-registration', (req, res) => {
    // Extract form data
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const email = req.body.email;
    const gender = req.body.gender;
    const birthDate = req.body.birthDate;
    const termsAgreement = req.body.termsAgreement === 'on'; // Checkbox value

    // Render a new page with the submitted details
    res.send(`
        <DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Registration Details</title>
        </head>
        <body>
            <h1>Registration Details</h1>
            <p>First Name: ${firstName}</p>
            <p>Last Name: ${lastName}</p>
            <p>Email: ${email}</p>
            <p>Gender: ${gender}</p>
            <p>Date of Birth: ${birthDate}</p>
            <p>Terms Agreement: ${termsAgreement ? 'Agreed' : 'Not Agreed'}</p>
        </body>
        </html>
    `);
});



// Handle form submission from form5.html
app.post('/submit-poem', upload.single('poemFile'), (req, res) => {
    // Check if a file was uploaded
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    // Check if the uploaded file is a text file
    const fileType = req.file.mimetype;
    if (fileType !== 'text/plain') {
        // Delete the uploaded file
        fs.unlinkSync(req.file.path);
        return res.status(400).send('Only text files (.txt) are allowed.');
    }

    // Read the content of the text file
    fs.readFile(req.file.path, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Error reading file.');
        }

        // Split the content into lines
        const lines = data.split('\n');

        // Generate the HTML for displaying the poem
        let html = '';
        for (let i = 0; i < lines.length; i++) {
            if (i === 0) {
                html += `<h1>${lines[i]}</h1>`;
            } else if (i === 1) {
                html += `<h2>${lines[i]}</h2>`;
            } else {
                html += `${lines[i]}<br>`;
            }
        }

        // Send the HTML response
        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Presenter Poem</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f9f9f9; /* Light beige background */
                        margin: 0;
                        padding: 20px;
                    }
                    #poem {
                        margin-top: 20px;
                        white-space: pre-line; /* Preserve line breaks */
                    }
                </style>
            </head>
            <body>
                <div id="poem">${html}</div>
            </body>
            </html>
        `);

        // Delete the uploaded file
        fs.unlinkSync(req.file.path);
    });
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});