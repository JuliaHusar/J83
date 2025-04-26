import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
const port = 8080;
const app = express();

app.use(cors());
app.use(bodyParser.json());

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});


app.get('/', (req, res) => {
    res.send('Hello World!');
});

