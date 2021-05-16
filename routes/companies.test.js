process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testCompany;

beforeEach(async () => {
    const result = await db.query(`INSERT INTO companies
    VALUES ('apple', 'Apple Computer', 'Maker of OSX.') RETURNING code,name,description`);
    testCompany = result.rows[0]
    const invoice = await db.query(`INSERT INTO invoices (comp_Code, amt, paid, paid_date)
    VALUES ('apple', 100, false, null)`)
})

afterEach(async () => {
    await db.query(`DELETE FROM companies`)
})

afterAll(async () => {
    await db.end()
})


describe("GET /companies", () => {
    test("Get a list with one user", async () => {
        const res = await request(app).get('/companies');
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ companies: [testCompany] })
    })
})

describe("GET /companies/id", () => {
    test("Return company info", async () => {
        const res = await request(app).get(`/companies/${testCompany.code}`);
        expect(res.body).toEqual({
            "company": {
                "code": "apple",
                "name": "Apple Computer",
                "description": "Maker of OSX.",
                "invoices": [expect.any(Number)]
            }
        })
    })
    test("Responds with 404 for invalid id", async () => {
        const res = await request(app).get('/companies/2');
        expect(res.statusCode).toBe(404);
    })
});

describe("POST /companies", () => {
    test("Creates a single company", async () => {
        const res = await request(app).post('/companies').send({ code: 'ibm', name: 'IBM', description: "Big blue." });
        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual({
            "company": {
                "code": "ibm",
                "name": "IBM",
                "description": "Big blue."
            }
        })
    })
})

describe("PUT /companies/:id", () => {
    test("Updates a single existing company", async () => {
        const res = await request(app).put(`/companies/${testCompany.code}`)
            .send({ name: "IBM", description: "Big blue." });
        expect(res.body).toEqual(
            {
                "company": {
                    "code": "apple",
                    "name": "IBM",
                    "description": "Big blue."
                }
            })
    })
})

describe("DELETE /", () => {
    test("Delete a company", async () => {
        const res = await request(app).delete(`/companies/${testCompany.code}`)
        expect(res.body).toEqual({ "status": "deleted" });
    })
})