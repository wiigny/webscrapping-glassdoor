import { app } from "./app.js";

const port = 3000;

app.listen(port, () => {
  console.log(`Server is Running on http://localhost:${port}`);
});
