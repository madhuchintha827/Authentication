const express = require("express");
const { open } = require("sqlite");
const path = require("path");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const dbPath = path.join(__dirname, "userData.db");

const app = express();
app.use(express.json());
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  //Encrypting Password: hashing=10
  const hashedPassword = await bcrypt.hash(password, 10);

  const checkUserName = `
    SELECT *
        FROM user
    WHERE username='${username}'`;

  const checkNameResponse = await db.get(checkUserName);
  //Scenario-1
  //check If the username already exists

  if (checkNameResponse !== undefined) {
    response.status(400);
    response.send("User already exists");
  } else {
    //Scenario-2
    //If the registrant provides a password with less than 5 characters

    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      //Scenario-3
      //Successful registration of the registrant after passing all condition's

      const insertNewUserQuery = `
        INSERT INTO user (username, name, password, gender, location)
            VALUES 
            ('${username}',
            '${name}',
            '${hashedPassword}',
            '${gender}',
            '${location}');`;

      await db.run(insertNewUserQuery);
      response.send("User created successfully");
    }
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const checkUserName = `
    SELECT *
        FROM user
    WHERE username='${username}'`;

  const checkNameResponse = await db.get(checkUserName);
  if (checkNameResponse === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatch = await bcrypt.compare(
      password,
      checkNameResponse.password
    );
    if (isPasswordMatch === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const checkUserName = `
    SELECT *
        FROM user
    WHERE username='${username}'`;

  const checkNameResponse = await db.get(checkUserName);

  if (checkNameResponse !== undefined) {
    const isPasswordMatch = await bcrypt.compare(
      oldPassword,
      checkNameResponse.password
    );

    if (isPasswordMatch === true) {
      if (newPassword.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const updateUserQuery = `
            UPDATE user SET 
            password = '${hashedPassword}'
            WHERE username ='${username}';
            `;
        await db.run(updateUserQuery);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  } else {
    response.status(400);
    response.send("Invalid user");
  }
});

module.exports = app;
