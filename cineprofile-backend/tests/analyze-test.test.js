// tests/analyze-test.test.js
import request from "supertest";
import app from "../src/app.js"; // app'i export eden dosya

describe("POST /api/analyze-test", () => {
  it("should accept {text} and return JSON with scores", async () => {
    const res = await request(app)
      .post("/api/analyze-test")
      .set("Content-Type", "application/json")
      .send({ text: "gun blood scream" });

    expect(res.status).toBe(200);
    expect(typeof res.body).toBe("object");
    expect(res.body).toHaveProperty("violence");
    expect(res.body).toHaveProperty("fear");
    expect(Array.isArray(res.body.risk_spans)).toBe(true);
  });
});
