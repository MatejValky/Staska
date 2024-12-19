import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = process.env.PORT || 4000;

const db = new pg.Client({
  user: "valky_user",
  connectionString: process.env.DB_HOST,
  database: "valky",
  password: process.env.DB_PASSWORD,
  port: "5432",
  ssl: {
    rejectUnauthorized: false
  }
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.json({ limit: '10mb' })); 

app.get("/", async (req, res) => {
    res.send("Hello World!");
});
app.post("/novaFirma",async (req, res) => {
    const meno_firmy = req.body.meno_firmy;
    const heslo_firmy = req.body.heslo;
    const email_firmy = req.body.email_firmy;
    try {
        await db.query(
            "INSERT INTO firmy (meno_firmy,password,email_firmy) VALUES ($1, $2, $3)",
            [meno_firmy,heslo_firmy,email_firmy]
        );
        res.send({message:"Uspešne pridaná firma"});
    } catch (err) {
        console.log(err);
        res.send({message:"Nespravne zadane udaje"});
    }
});

app.post("/firmy/novyManager",async (req, res) => {
    const id_firmy = req.body.id_firmy;
    const meno_managera = req.body.meno_managera;
    const heslo_managera = req.body.heslo_managera;
    try{
        await db.query(
            "INSERT INTO managery (id_firmy,meno_managera,heslo_managera) VALUES ($1, $2, $3)",
            [id_firmy,meno_managera,heslo_managera]
        );
        res.send({message:"Uspešne pridaný manager"});
    }catch(err){
        console.log(err);
        res.send({message:"Nespravne zadane udaje"});
    }
});
app.get("/firmy",async (req, res) => {


});

app.post("/manager", async (req, res) => {
    const meno_managera =req.body.meno_managera;
    const heslo_managera =req.body.heslo_managera;
    try{
        let vsetkyAuta = []
        let datum = new Date();
        let month = datum.getMonth() + 1;
        console.log("month",month);


        month = month < 10 ? '0' + month : month;
        let id_managera = await db.query("SELECT id_managera FROM managery WHERE managery.meno_managera= $1 AND managery.heslo_managera= $2 ",[meno_managera,heslo_managera]);
        id_managera=id_managera.rows[0].id_managera;
        let auta = await db.query("SELECT * FROM auta WHERE auta.id_managera= $1 ",[id_managera]);

        let id_auta =[]
        for(let i=0; i<auta.rows.length;i++){
            id_auta.push(auta.rows[i].id_auta);
        }

        for (let i=0; i<id_auta.length;i++){
            let spoluKilometre=0;
            let spoluCerpanie=0;
            /*let jednotliveAuta={
                zaciatocnyStavKilometre:,
                konecnyStavKilometre:,
                spoluKilometre:,
                zaciatocnyStavNadrze:,
                konecnyStavNadrze:,
                cerpanie:,
                priemernaSpotreba:,

            }*/
            let stasky = await db.query("SELECT * FROM cerpanie WHERE cerpanie.id_auta= $1 ",[id_auta[i]]);
            stasky = stasky.rows;


            for(let j=0; j<stasky.length;j++){
                if(j>0){
                    let kilometre=stasky[j].stav_kilometre-stasky[j-1].stav_kilometre;
                    spoluKilometre+=kilometre;

                }
                spoluCerpanie+=stasky[j].tankovanie;
                
                console.log("staska",j,stasky[j]);
                console.log("spoluKilometre",spoluKilometre);
                console.log("spoluCerpanie",spoluCerpanie);
            }
            let priemernaSpotreba=spoluKilometre/100/spoluCerpanie;
            console.log("priemernaSpotreba",priemernaSpotreba);

        }

    }catch(err){
        console.log(err);
        res.send({message:"Manager neexistuje"});
    }
    
    
});
app.post("/manager/noveVozidlo", async (req, res) => {
    const meno_managera = req.body.meno_managera;
    const nazov_auta= req.body.nazov_auta;
    const zaciatocny_stav_kilometre = req.body.zaciatocny_stav_kilometre;
    const zaciatocny_stav_nadrze = req.body.zaciatocny_stav_nadrze;
    const SPZ = req.body.SPZ;
    const primarny_vodic = req.body.primarny_vodic;
    const heslo_auta = req.body.heslo_auta;
    try{
        let id_managera = await db.query("SELECT id_managera FROM managery WHERE managery.meno_managera= $1 ",[meno_managera]);
        id_managera=id_managera.rows[0].id_managera;
        try {
            await db.query(
                "INSERT INTO auta (id_managera,zaciatocny_stav_kilometre,zaciatocny_stav_nadrz,SPZ,primarny_vodic,heslo_auta,nazov_auta) VALUES ($1, $2, $3, $4, $5, $6, $7)",
                [id_managera,zaciatocny_stav_kilometre,zaciatocny_stav_nadrze,SPZ,primarny_vodic,heslo_auta,nazov_auta]
            );
            res.send({message:"Uspešne pridané vozidlo"});
        } 
        catch (err) {
            console.log(err);
            res.send({message:"Nespravne zadane udaje"});
        }
    }
    catch(err){
        console.log(err);
        res.send({message:"Nespravne zadane meno managera"});
    }
    
})

/*app.post("/zamestnanci/login", async (req, res) => {
    const password = req.body.heslo_auta;

    const id_auta= await db.query(
        "SELECT id_auta FROM auta WHERE heslo_auta= $1 ",
        [password]);
    let manager = await db.query(
        "SELECT meno_managera FROM auta JOIN managery ON auta.id_managera=managery.id_managera WHERE auta.heslo_auta= $1 ",
        [password]);
    let firma= await db.query(
        "SELECT Meno_firmy FROM managery JOIN firmy ON managery.id_firmy=firmy.id_firmy WHERE meno_managera= $1 ",
        [manager.rows[0].meno_managera]);
    let primarnyVodic= await db.query(
        "SELECT primarny_vodic FROM auta JOIN managery ON auta.id_managera=managery.id_managera WHERE auta.heslo_auta= $1 ",
        [password]);

    let frontEndData ={
        idAuta: id_auta.rows[0].id_auta,
        menoManagera: manager.rows[0].meno_managera,
        menoFirmy: firma.rows[0].meno_firmy,
        primarnyVodic: primarnyVodic.rows[0].primarny_vodic
        
    }

    res.send(frontEndData);   
});*/
app.post("/zamestnanci/staska", async (req, res) => {
    const password = req.body.heslo_auta;
    const vodic = req.body.vodic;
    const stav_kilometre= req.body.stav_kilometre;
    const stav_nadrze= req.body.stav_nadrze;
    let tankovanie = req.body.tankovanie;
    let id_auta= await db.query(
        "SELECT id_auta FROM auta WHERE heslo_auta= $1 ",
        [password]);
    id_auta=id_auta.rows[0].id_auta;
    if(tankovanie==null){
        console.log("Nenastavene tankovanie");
        tankovanie=0;
    }
    try{
 
        const Zapisane= await db.query("SELECT stav_kilometre FROM cerpanie ORDER BY id DESC LIMIT 1 WHERE id_auta=$1",[id_auta]);
        const Zapisane_zaciatocne= await db.query("SELECT zaciatocny_stav_kilometre FROM auta WHERE id_auta=$1",[id_auta]);

        if(Zapisane.rows[0].stav_kilometre>stav_kilometre){
            res.send({message:"Nespravne zadane PHM"});
        }
        else if(Zapisane_zaciatocne.rows[0].zaciatocny_stav_kilometre>stav_kilometre){
            res.send({message:"Nespravne zadane PHM"});
        }
        else{
            let datum = new Date();
            const year = datum.getFullYear();
            let month = datum.getMonth() + 1;
            let day = datum.getDate();
            month = month < 10 ? '0' + month : month;
            day = day < 10 ? '0' + day : day;

                
            datum= `${year}-${month}-${day}`;
            console.log("Zapisujem");
            try {
                await db.query(
                    "INSERT INTO cerpanie (id_auta,vodic,stav_kilometre,stav_nadrze,datum,tankovanie) VALUES ($1, $2, $3, $4, $5, $6)",
                    [id_auta,vodic,stav_kilometre,stav_nadrze,datum,tankovanie]
                );
                res.send({message:"Uspešne zapísane udaje"});
            } catch (err) {
                console.log(err);
        }}
    }catch(err){
        const Zapisane= await db.query("SELECT zaciatocny_stav_kilometre FROM auta WHERE id_auta=$1",[id_auta]);
        if(Zapisane.rows[0].zaciatocny_stav_kilometre>stav_kilometre){
            res.send({message:"Nespravne zadane PHM"});
        }
        else{
            console.log("Zapisujem");
            let datum = new Date();
            const year = datum.getFullYear();
            let month = datum.getMonth() + 1;
            let day = datum.getDate();
            month = month < 10 ? '0' + month : month;
            day = day < 10 ? '0' + day : day;

                
            datum= `${year}-${month}-${day}`;

            try {
                await db.query(
                    "INSERT INTO cerpanie (id_auta,vodic,stav_kilometre,stav_nadrze,datum,tankovanie) VALUES ($1, $2, $3, $4, $5, $6)",
                    [id_auta,vodic,stav_kilometre,stav_nadrze,datum,tankovanie]
                );
                res.send({message:"Uspešne zapísane udaje"});
            } catch (err) {
                console.log(err);
            }
        }
    }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log(process.env.DB_HOST);
  console.log(process.env.DB_PASSWORD);
});