const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors()); // Ajout de CORS middleware pour toutes les routes

mongoose
  .connect('mongodb+srv://ad:1234@cluster0.4ppooxl.mongodb.net/TP-Web')
  .then(() => {
    console.log("connecting to mongodb ...");
  })
  .catch((error) => {
    console.log("error connecting !" + error);
  });

  const UserSchema = new mongoose.Schema(
    {
      login: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 200,
        trim: true,
      },
      password: {
        type: Number,
        required: true,
        minlength: 3,
        maxlength: 200,
        trim: true,
      },
      comptes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Compte' }],
      passport: { type: mongoose.Schema.Types.ObjectId, ref: 'Passport' }
    },
    {
      timestamps: true,
    }
  );

  const CompteSchema = new mongoose.Schema(
    {
      idCompte: {
        type: String
      },
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      solde: {
        type: Number,
        required: true
      }
    },
    {
      timestamps: true,
    }
  );
  
  const PassportSchema = new mongoose.Schema(
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    {
      timestamps: true,
    }
  );

  const User = mongoose.model("User",UserSchema);
  const Compte = mongoose.model("Compte",CompteSchema);
  const Passport = mongoose.model("Passport",PassportSchema);


  //Création d'un compte pour un utilisateur donné


  app.post("/user/:userId/compte", async (req, res) => {
    try {
      const user = await User.findById(req.params.userId);
      if (!user) return res.status(404).json({ message: "User not found" });
  
      const newCompte = new Compte({
        idCompte: req.body.idCompte,
        user: user._id
      });
  
      await newCompte.save();
  
      user.comptes.push(newCompte._id);
      await user.save();
  
      res.status(201).json(newCompte);
    } catch (error) {
      res.status(400).json(error);
    }
  });

  // Création d'un passeport pour un utilisateur donné (assumant qu'il n'y a qu'un seul passeport par utilisateur)
app.post("/user/:userId/passport", async (req, res) => {
    try {
      const user = await User.findById(req.params.userId);
      if (!user) return res.status(404).json({ message: "User not found" });
  
      // Vérifier si l'utilisateur a déjà un passeport
      if (user.passport) {
        return res.status(400).json({ message: "User already has a passport" });
      }
  
      const newPassport = new Passport({
        user: user._id
      });
  
      await newPassport.save();
  
      user.passport = newPassport._id;
      await user.save();
  
      res.status(201).json(newPassport);
    } catch (error) {
      res.status(400).json(error);
    }
  });


app.get("/user", async (req, res) => {
  try {
    const allUsers = await User.find();

    res.status(200).json(allUsers);
  } catch (error) {
    res.status(400).send("error");
  }
});

app.post("/user", async (req, res) => {
  try {
    const newUser = new User({
      login: req.body.login,
      password: req.body.password,
    });

    const result = await newUser.save();

    res.status(200).json({ result });
  } catch (error) {
    res.status(400).json(error);
  }
});

app.delete("/user/:id", async (req, res) => {
  try {
    const deletedOne = await User.findByIdAndDelete(req.params.id);

    res.status(200).json(deletedOne);
  } catch (error) {
    res.status(400).json(error);
  }
});

app.patch("/user/:id", async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.status(201).json(updatedUser);
  } catch (error) {
    res.status(400).json(error);
  }
});


app.get("/users-with-comptes", async (req, res) => {
    try {
      const usersWithComptes = await User.aggregate([
        {
          $lookup: {
            from: "comptes", // Nom de la collection à joindre
            localField: "comptes", // Champ local à partir duquel faire la jointure
            foreignField: "_id", // Champ dans la collection "comptes" pour la jointure
            as: "comptes" // Nom du champ dans le résultat de la jointure
          }
        }
      ]);
  
      res.status(200).json(usersWithComptes);
    } catch (error) {
      res.status(400).json(error);
    }
  });


  app.get("/users-solde-sup-100", async (req, res) => {
    try {
      const usersWithComptes = await User.aggregate([
        {
          $lookup: {
            from: "comptes", // Nom de la collection à joindre
            localField: "_id", // Champ local à partir duquel faire la jointure (dans User)
            foreignField: "user", // Champ dans la collection "comptes" pour la jointure
            as: "comptes" // Nom du champ dans le résultat de la jointure
          }
        },
        {
          $match: {
            "comptes.solde": { $gt: 100 }
          }
        }
      ]);
  
      res.status(200).json(usersWithComptes);
    } catch (error) {
      res.status(400).json(error);
    }
  });
  
  app.get("/users-solde-sup-1000", async (req, res) => {
    try {
      const usersWithComptes = await User.aggregate([
        {
          $lookup: {
            from: "comptes", // Nom de la collection à joindre
            localField: "_id", // Champ local à partir duquel faire la jointure (dans User)
            foreignField: "user", // Champ dans la collection "comptes" pour la jointure
            as: "comptes" // Nom du champ dans le résultat de la jointure
          }
        },
        {
          $match: {
            "comptes.solde": { $gt: 1000 }
          }
        }
      ]);
  
      res.status(200).json(usersWithComptes);
    } catch (error) {
      res.status(400).json(error);
    }
  });


  app.get("/etudiants-solde-sup-1000", async (req, res) => {
    try {
      const etudiants = await User.aggregate([
        {
          $lookup: {
            from: "comptes", // Nom de la collection à joindre
            localField: "_id", // Champ local à partir duquel faire la jointure (dans User)
            foreignField: "user", // Champ dans la collection "comptes" pour la jointure
            as: "comptes" // Nom du champ dans le résultat de la jointure
          }
        },
        {
          $match: {
            "comptes.solde": { $gt: 1000 }
          }
        },
        {
          $lookup: {
            from: "passports", // Nom de la collection à joindre
            localField: "_id", // Champ local à partir duquel faire la jointure (dans User)
            foreignField: "user", // Champ dans la collection "passports" pour la jointure
            as: "passport" // Nom du champ dans le résultat de la jointure
          }
        },
        {
          $project: {
            _id: 1,
            login: 1,
            passport: 1
          }
        }
      ]);
  
      res.status(200).json(etudiants);
    } catch (error) {
      res.status(400).json(error);
    }
  });
  
  
  

app.listen(2000, () => {
  console.log("Server listening on port 2000");
});
