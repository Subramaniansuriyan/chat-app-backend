const cons = require("consolidate");
const multer = require('multer');
const upload = multer({dest:'./Images'});

const {
  router,
  jwt,
  client
} = require("../index");

const verifyToken = require("../services/verification");

const storage = multer.diskStorage({
  destination:'./Images'
})

// sign up
// router.post("/signup", (req, res) => { 
//   res.json({
//     message:"testing"
//   })
// });
router.post("/signup", (req, res) => {
  console.log(req.body.email)
  console.log(req.body.pw)
  let values = [req.body.email, req.body.pw];
  console.log(values)

  client.query(
    'SELECT * FROM users WHERE useremail = $1',
    [values],
    (err, result) => {
      if (err) {
        res.send(err);
      } else {
        if (result.rows.length != 0) {
          res.json({
            errorEmail: `${req.body.email} is already in use`
          })
        } else {
          let query = {
            text: 'INSERT INTO users(useremail, userpw) VALUES($1, $2) RETURNING id, useremail',
            values
          };
          client.query(query, (err, result) => {
            if (err) {
              res.send(err)
            } else {
              let token = jwt.sign({
                email: result["rows"][0]["useremail"],
                id: result["rows"][0]["id"]
              }, "shhh");
              res.json({
                token,
                id: result["rows"][0]["id"]
              });
            }
          })
        }
      }
    });
});

// router.post('/upload',upload.single('image'))

// Checking for the localStorage
router.post("/authenticate", (req, res) => {
  jwt.verify(req.body.userToken, 'shhh', function (err, decoded) {
    if (err || req.body.userid != decoded.id) {
      throw "Invalid token";
      res.end();
    } else {
      res.end();
    }
  });
});

// Login
router.post("/login", (req, res) => {
  // console.log(req.body.email)
  let query = {
    text: 'SELECT * FROM users WHERE useremail=$1',
    values: [req.body.email]
  };

  client.query(query, (err, result) => {
    if (err) {
      res.json({
        errorEmail: "Something went wrong checking the email"
      })
    } else {
      // if email does not exist, send error msg 
      if (!result.rows.length) {
        res.json({
          errorEmail: `${req.body.email} doesn't exist`
        })
      }
      // if email does exist, then check for the password in the DB
      else {
        let query = {
          text: 'SELECT * FROM users WHERE userpw=$2 AND useremail=$1',
          values: [req.body.email, req.body.pw]
        }
        client.query(query, (err, result) => {
          if (err) {
            res.json({
              errorPW: "Something went wrong while checking the password"
            })
          } else {
            if (result.rows.length == 1) {
              let token = jwt.sign({
                email: result["rows"][0]["useremail"],
                id: result["rows"][0]["id"]
              }, "shhh");

              res.json({
                token,
                id: result["rows"][0]["id"]
              });
            } else {
              res.json({
                errorPw: "Incorrect password"
              })
            }
          }
        })
      }
    }
  })
})
router.get("/username/:id", (req, res) =>{
  // console.log(req.params.id)
  let uid = Number(req.params.id)
  client.query('SELECT * FROM users WHERE id = $1', [uid], (err, result) => {
    if (err) {
      console.log(err);
      res.send(err);
    } else { 
      res.json({
        user:result.rows
      })
    }
  })
})

// router.post('/upload',upload.single('image'), (req, res) =>{
//   console.log(req.file)
//   // let uid = Number(req.params.id)
//   // client.query('SELECT * FROM users WHERE id = $1', [uid], (err, result) => {
//   //   if (err) {
//   //     console.log(err,1);
//   //     res.send(err);
//   //   } else { 
//   //     res.json({
//   //       user:result.rows
//   //     })
//   //   }
//   // })
// })

module.exports = router;