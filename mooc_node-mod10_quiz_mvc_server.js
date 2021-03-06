const express = require('express');
const app = express();

   // Import MW for parsing POST params in BODY

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

   // Import MW supporting Method Override with express

var methodOverride = require('method-override');
app.use(methodOverride('_method'));
app.use(methodOverride('_method', { methods: ['POST','GET']}));

   // MODEL

const Sequelize = require('sequelize');

const options = { logging: false, operatorsAliases: false};
const sequelize = new Sequelize("sqlite:db.sqlite", options);

const quizzes = sequelize.define(  // define table quizzes
    'quizzes',     
    {   question: Sequelize.STRING,
        answer: Sequelize.STRING
    }
);

sequelize.sync() // Syncronize DB and seed if needed
.then(() => quizzes.count())
.then((count) => {
    if (count===0) {
        return ( 
            quizzes.bulkCreate([
                { id: 1, question: "Capital of Italy",    answer: "Rome" },
                { id: 2, question: "Capital of France",   answer: "Paris" },
                { id: 3, question: "Capital of Spain",    answer: "Madrid" },
                { id: 4, question: "Capital of Portugal", answer: "Lisbon" }
            ])
            .then( c => console.log(`  DB created with ${c.length} elems`))
        )
    } else {
        return console.log(`  DB exists & has ${count} elems`);
    }
})
.catch( err => console.log(`   ${err}`));


   // VIEWs

const index = (quizzes) => `<!-- HTML view -->
<html>
    <head><title>MVC Example</title><meta charset="utf-8">
        <style>
            body {
                background: #42A9D6;
            }
            .centro {
                margin: auto;
                text-align: center;
            }
            button {
                background-color:#81d4fa;    
                padding:0.3rem;
                border-radius:5px;
                border:solid 1px #0288d1;
                margin-top:0.3em;
                margin-bottom:0.3em;
                width:8em;
                cursor:pointer;
            }
            button:hover {
                background-color:#0277bd;
                color:white;    
            }
        </style>
    </head> 
    <body> 
     <h1  class="centro">MVC: Quizzes</h1><br><br><br><br>
     <table class="centro">`
+ quizzes.reduce(
    (ac, quiz) => ac += 
`       <tr>
            <td>
                <a href="/quizzes/${quiz.id}/play">${quiz.question}</a>
            </td>
            <td>
                <a href="/quizzes/${quiz.id}/edit"><button>Edit</button></a>
            </td>
            <td>
            <td>
                <a href="/quizzes/${quiz.id}?_method=DELETE"
                       onClick="return confirm('Desea eliminar el quiz: ${quiz.question}')">
                       <button>Delete</button></a>
            </td>        
        </tr>
        `,""        
    )
+ `
        <tr>
            <td>
            <div><a href="/quizzes/new"><button>New Quiz</button></a></div>
            </td>
        </tr>
    </table>
    
    </body>
</html>`;

const play = (id, question, response) => `<!-- HTML view -->
<html>
    <head>
    <title>MVC Example</title>
    <meta charset="utf-8">
        <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>
        <script type="text/javascript">
            $(function(){
                $('#play').on('click',function(){
                    $.ajax
                    ({
                        type:'POST',
                        url:'/quizzes/${id}/playAjax/'+$('#answer').val(),
                        success: (msg) => {
                            $('#solucion').text(msg);
                        }
                    });
                })
            });
        </script>
        <style>
            body {
                background: #42A9D6;
            }
            .centro {
                margin: auto;
                text-align: center;
            }            
            button, input[type=submit] {
                background-color:#81d4fa;    
                padding:0.3rem;
                border-radius:5px;
                border:solid 1px #0288d1;
                margin-top:0.3em;
                margin-bottom:0.3em;
                width:8em;
                cursor:pointer;
            }
            button:hover {
                background-color:#0277bd;
                color:white;    
            }
            input[type=submit]:hover{
                background-color:#0277bd;
                color:white;    
            }
            #solucion {
                font-family: Impact, Charcoal, sans-serif;
                font-size: 20px;

            }
            #question {
                font-weight: bold;
                font-size: 20px;
            }

        </style>       
    </head>
    <body>
    </head> 
        <h1 class="centro">MVC: Quizzes</h1><br><br><br><br>
        <div class="centro">               
            <span id="question">${question}:</span>
            <p>
                <input id ='answer' type="text" name="response" value="${response}" placeholder="Answer" />
                <button id ='play' value="Check">Comprobar</button>
                <p id="solucion"></p>
            </p>
        <a href="/quizzes"><button>Go back</button></a>
        </div>
    </body>
</html>`;

const quizForm =(msg, method, action, question, answer) => `<!-- HTML view -->
<html>
    <head><title>MVC Example</title><meta charset="utf-8">    
        <style>
            body {
                background: #42A9D6;
            }
            .centro {
                margin: auto;
                text-align: center;
            }         
            #msg {
                font-weight: bold;
                font-size: 20px;
            }   
            button, input[type=submit] {
                background-color:#81d4fa;    
                padding:0.3rem;
                border-radius:5px;
                border:solid 1px #0288d1;
                margin-top:0.3em;
                margin-bottom:0.3em;
                width:8em;
                cursor:pointer;
            }
            button:hover {
                background-color:#0277bd;
                color:white;    
            }
            input[type=submit]:hover{
                background-color:#0277bd;
                color:white;    
            }
        </style>
    </head> 
    <body>
    <div class="centro">
        <h1 class="centro">MVC: Quizzes</h1><br><br><br><br>
        <form method="${method}" action="${action}">
            <span id="msg">${msg}:</span> <p>
            <input  type="text"  name="question" value="${question}" placeholder="Question" />
            <input  type="text"  name="answer"   value="${answer}"   placeholder="Answer" />
            <input  type="submit" value="Aceptar"/> <br>
        </form>
        </p>
        <a href="/quizzes"><button>Go back</button></a>
        </div>
    </body>
</html>`;


   // CONTROLLER

// GET /, GET /quizzes
const indexController = (req, res, next) => {
    quizzes.findAll()
    .then((quizzes) => res.send(index(quizzes)))
    .catch((error) => `DB Error:\n${error}`);
}

//  GET  /quizzes/1/play
const playController = (req, res, next) => {
    let id = Number(req.params.id);
    let response = req.query.response || "";

    quizzes.findByPk(id)
    .then((quiz) => res.send(play(id, quiz.question, response)))
    .catch((error) => `A DB Error has occurred:\n${error}`);
 };

//  GET  /quizzes/1/check
const checkController = (req, res, next) => {
    let response = req.query.response, msg;
    let id = Number(req.params.id);

    quizzes.findByPk(id)
    .then((quiz) => {
        msg = (quiz.answer===response) ?
              `Yes, "${response}" is the ${quiz.question}` 
            : `No, "${response}" is not the ${quiz.question}`;
        return res.send(check(id, msg, response));
    })
    .catch((error) => `A DB Error has occurred:\n${error}`);
};

//  GET /quizzes/1/edit
const editController = (req, res, next) => {
    let id = Number(req.params.id);
    quizzes.findByPk(id)
    .then(quiz => {
        res.send(quizForm("Edit Quiz", "post", `/quizzes/${id}/update`, quiz.question, quiz.answer));
    })
    .catch(error => `Quiz not created:\n${error}`);
};

//  PUT /quizzes/1
const updateController = (req, res, next) => {
    let id = Number(req.params.id);
    let {question, answer} = req.body;
    quizzes.findByPk(id)
    .then(quiz => {
        quiz.answer = answer;
        quiz.question = question;
        quiz.save()
        .then(quiz => res.redirect('/quizzes'))        
        }           
    )
    .catch(error => {
        console.log(error);
    })
};

// GET /quizzes/new
const newController = (req, res, next) => {
    res.send(quizForm("Create new Quiz", "post", "/quizzes", "", ""));
 };

// POST /quizzes
const createController = (req, res, next) => {
    let {question, answer} = req.body;
    quizzes.build({question, answer})
    .save()
    .then((quiz) => res.redirect('/quizzes'))
    .catch((error) => `Quiz not created:\n${error}`);
 };

// DELETE /quizzes/1
const destroyController = (req, res, next) => {
    let id = Number(req.params.id);
    quizzes.destroy({where:{id}})
    .then(quiz => res.redirect('/quizzes'))  
    .catch(error => {
        console.log(error);
    })
 };

 const checkPlayAjaxController = (req, res, next) => {
    let id = Number(req.params.id);
    let response = (req.params.answer);
    quizzes.findByPk(id)
    .then((quiz) => {
        msg = (quiz.answer === response) ? `La respuesta a ${quiz.question}: ${response} es correcta` : `La respuesta a ${quiz.question}: ${response} es incorrecto`;
        return res.send(msg);
    })
    .catch((error) => `A DB Error has occurred:\n${error}`);
};



   // ROUTER

app.get(['/', '/quizzes'],    indexController);
app.get('/quizzes/:id/play',  playController);
app.get('/quizzes/:id/check', checkController);
app.get('/quizzes/new',       newController);
app.post('/quizzes',          createController);

    // ..... instalar los MWs asociados a
    //   GET  /quizzes/:id/edit,   PUT  /quizzes/:id y  DELETE  /quizzes/:id

app.get('/quizzes/:id/edit',   editController);
app.delete('/quizzes/:id', destroyController);
app.post('/quizzes/:id/update', updateController);
app.post('/quizzes/:id/playAjax/:answer', checkPlayAjaxController);

app.all('*', (req, res) =>
    res.send("Error: resource not found or method not supported")
);        


   // Server started at port 8000

app.listen(8000);
