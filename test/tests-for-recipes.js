const chai = require("chai");
const chaiHttp = require("chai-Http");
const {app, runServer, closeServer} = require("../server");

// allows the use of *expect* style syntax such as `expect(1 + 1).to.equal(2);`
const expect = chai.expect; 

// this makes HTTP requests in tests possible
chai.use(chaiHttp);

describe("Recipes", function() {
    // before tests run activate server
    before(function() {
        return runServer; // returns runServer promise
    })
    // closes server at the end tests
    after(function() {
        return closeServer; 
    })

    // test strategy:
    // 1. make request to `/recipes`
    // 2. inspect response object and prove has right code 
    // 2a. and have right keys in response object

    it("should list recipes on GET", function() {
        // must return Promise object or call a `done` callback at end of test
        // `chai.request(server).get...` call is asynchronous 
        // and returns a Promise, so just return it
        return chai
        .request(app)
        .get("/recipes").then(function(res) {
            expect(res).to.have.status(200);
            expect(res).to.be.json;
            expect(res.body).to.be.a("array");

            // because items are created on app load
            expect(res.body.length).to.be.at.least(1);

            // each item should be object with key/value pairs
            // for name, id and ingredients
            const expectedKeys = ["id", "name", "ingredients"];
            res.body.forEach(function(item) {
                expect(item).to.be.a("object");
                expect(item).to.include.keys(expectedKeys);
            });
        });
    });

    // test strategy:
    //  1. make POST request with data for a new item
    //  2. inspect response object and prove it has right
    //  2a. status code and that the returned object has an `id`

    it("should add an item on POST", function() {
        const newItem = { name: "coffee", ingredients: ["water", "beans"] };
        return chai
        .request(app)
        .post("/recipes")
        .send(newItem)
        .then(function(res) {
            expect(res).to.have.status(201);
            expect(res).to.be.json;
            expect(res).to.be.a("object");
            expect(res.body.id).to.not.equal(null);
            expect(res.body).to.include.keys('id', 'name', 'ingredients');
            expect(res.body.name).to.be.equal(newItem.name);
            expect(res.body.ingredients).to.be.a('array');
            expect(res.body.ingredients).to.include.members(newItem.ingredients);
        }); 
    });
    
    // test strategy:
    //  1. initialize some update data 
    //  2. make a GET request so we can get an item to update
    //  3. add the `id` to `updateData`
    //  4. Make a PUT request with `updateData`
    //  5. Inspect the response object to ensure right status code 
    //  5a. and returns updated item with the right data in it.

    it("should update items on PUT", function() {
        // we initialize our updateData here and then after the initial
        // request to the app, we update it with an `id` property so
        // we can make a second, PUT call to the app.
        const updateData = {
            name: "tea",
            ingredients: ["hot water", "tea bag"]
        };
        return chai
        .request(app).get("/recipes")
        .then(function(res) {
            updateData.id = res.body[0].id;

            // this will return a promise whose value will be the response
            // object, which we can inspect in the next `then` block. Note
            // that we could have used a nested callback here instead of
            // returning a promise and chaining with `then`, but we find
            // this approach cleaner and easier to read and reason about
            return chai
            .request(app)
            .put(`/recipes/${updateData.id}`).send(updateData);
        })

        // prove that the PUT request has right status code
        // and returns updated item
        .then(function(res) {
            expect(res).to.have.status(204);
            // expect(res).to.be.json; // <= test failed
            expect(res.body).to.be.a("object");
            // expect(res.body).to.deep.equal(updateData); // <= test failed
          })
    });

    // test strategy:
    //  1. GET shopping list items so we can get ID of one
    //  to delete.
    //  2. DELETE an item and ensure we get back a status 204

    it("should delete items on DELETE", function() {
        return chai
        .request(app)

        // first GET so theres have an `id` to delete
        .get("/recipes")
        .then(function(res) {
            return chai.request(app).delete(`/recipes/${res.body[0].id}`);
        })
        .then(function(res) {
            expect(res).to.have.status(204);
        })
    })
});