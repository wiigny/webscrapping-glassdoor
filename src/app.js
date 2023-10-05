import axios from "axios";
import express from "express";
import * as cheerio from "cheerio";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./swagger.json" assert { type: "json" };

export const app = express();

app.use(express.json());

app.use("/api-docs", swaggerUi.serve);

app.get("/api-docs", swaggerUi.setup(swaggerDocument));

app.post("/glassdoor", async (request, response) => {
  if (!request.body.link) {
    return response.status(400).json({ message: "field link is empty" });
  }

  const result = await axios.get(request.body.link, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
  });

  const $ = cheerio.load(result.data);

  const h3List = $("h3");

  const salaries = [];

  const companies = [];

  h3List.each((i, elt) => {
    if ($(elt).attr("data-test")) {
      const companyName = $(elt).find("a").text();

      companies.push(companyName);
    }

    if ($(elt).text().includes("R$")) {
      const salary = $(elt).text();

      const div = $(elt).parent().parent().parent();

      const spanJobOffer = $(div).find("div span[data-test]").find("span");

      const job = $(spanJobOffer).text().split(":");

      const payment = $(elt).parent().find("span span").text();

      if (payment.includes("Cerca")) {
        const arr = job[1].split(" ");

        const type = arr[arr.length - 1];

        salaries.push({ salary, job: job[0], payment: type });
      } else {
        salaries.push({ salary, job: job[0], payment });
      }
    }
  });

  const data = Array.from({ length: companies.length }).map((v, i) => {
    return { companie: companies[i], ...salaries[i] };
  });

  if (!data.length) {
    return response
      .status(400)
      .json({ message: "the link sent does not have job offers" });
  }

  return response.status(201).json(data);
});
