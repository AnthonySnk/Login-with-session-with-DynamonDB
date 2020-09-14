var AWS = require("aws-sdk");
const { Router } = require("express");
const router = Router();

/* AWS CONF. BOL */
AWS.config.update({
  region: "us-east-1",
  accessKeyId: "",
  secretAccessKey: "",
});
var docClient = new AWS.DynamoDB.DocumentClient();

router.get("/", (req, res) => {
  res.render("index");
});

/* exports.checkSessionID = */ async function checkSessionID(
  sessionID_from_header
) {
  var sessionID_search = sessionID_from_header.toString();
  //Read for current SessionID.
  var params = {
    TableName: "tbl-storage",
    Key: {
      objectId: sessionID_from_header,
      tipoObjeto: 999121,
    },
  };

  let respuesta = docClient.get(params, function (err, data) {
    if (err) {
      console.log({ Error: { Critical: "Unable to process item. " + err } });
      return err;
    } else {
      if (data.Item.objectId === sessionID_from_header) {
        console.log(
          "SessionID checks out to be OK - Returning to next statement in submitting function"
        );
        return data;
        //define type error
      }
    }
  });
}

router.post("/register", (req, res) => {
  const { email, password } = req.body;
  // req.session.my_variable = 'Hello World!';
  req.session.user_data = { email, password };

  var params = {
    TableName: "tbl-storage",
    Key: {
      objectId: req.session.user_data.email,
      tipoObjeto: 999120,
    },
  };

  function SessionID_Generator() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return (
      s4() +
      s4() +
      "-" +
      s4() +
      "-" +
      s4() +
      "-" +
      s4() +
      "-" +
      s4() +
      s4() +
      s4()
    );
  }

  function writeSessiontoDB(SessionID) {
    var WriteSessionID = {
      TableName: "tbl-storage",
      Item: {
        objectId: SessionID,
        tipoObjeto: 999121,
        fecha: Date().toString(),
        userName: req.session.user_data.email,
      },
    };
    docClient.put(WriteSessionID, function (err, data) {
      if (err) {
        console.log("No pudismos hacer el put. Error JSON:", err, 2);
      }
    });
  }

  docClient.get(params, function (err, data) {
    if (err) {
      console.log(err);
      res.redirect("/");
    } else {
      console.log(data);
      const { email, password } = req.body;
      req.session.user_data = { email, password };
      foundpassword_from_DB = data.Item.password;

      if (req.session.user_data.password === foundpassword_from_DB) {
        req.session.user_data.sessionID = SessionID_Generator();
        writeSessiontoDB(req.session.user_data.sessionID);
        // res.send({"OK":{"SessionID":SessionID}});
        req.flash("success", "Este es tu reporte");
        res.redirect("/profile");
      } else {
        res.redirect("/");
      }
    }
  });
});

router.get("/profile", async (req, res) => {
  // console.log(req.get('SessionID'))
  try {
    let user = req.session.user_data
    checkSessionID(user.sessionID);
    res.render("profile", {
      user,fruta:'https://www.facebook.com'
    });
    router.get('/main',(req,res)=>{res.render('http://www.facebook.com')})
  } catch (error) {
    console.log(error);
    res.redirect("/");
  }
});

router.get("/products", (req, res) => {
  res.render("products");
});

module.exports = router;
