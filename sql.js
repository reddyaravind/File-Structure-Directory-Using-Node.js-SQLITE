
const sqlite = require('sqlite3').verbose()
const express = require('express')
const app = express()
var bodyParser = require('body-parser');
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.json())
app.use(express.static('public'));
const router = express.Router
app.use(bodyParser.urlencoded({ extended: false }))

app.post('/posting', (req, res) => {
    console.log(req.body)
    return res.json(req.body)
})


const db = new sqlite.Database('./db.db', sqlite.OPEN_READWRITE, (err) => {
    if (err) {
        console.log(err)
    }
    else {
        console.log('CONNECTED TO SQL')
    }
})



app.get('/creat_table', (req, res) => {
    db.run(
        `create table myfile (parent_path,path,value,file,context,mtime,ctime)`,
        (err) => {
            if (err) { return res.status(400).json({ err: err }) }
            res.status(200).json({ message: 'TABLE CREATED' })
        }
    )
})
app.get('/drop_table', (req, res) => {
    db.run(
        `drop table myfile`,
        (err) => {
            if (err) { return res.status(400).json({ err: err }) }
            res.status(200).json({ message: 'TABLE DROPED' })
        }
    )
})

app.post('/insert', (req, res) => {
    let string1 = req.body.file_path
    let query
    let ftype = req.body.ftype
    let t = string1
    let p = t.split('/')
    console.log('-----')
    console.log(p.length)
    console.log('-----')


    if (p.length == 2) {
        console.log('entered')
        query = `select  parent_path from myfile where path = '${string1}'`
        db.all(query, [], (err, rows) => {
            if (err) {
                return res.json({ err: err })
            }
            else if (rows.length > 0) {
                return res.status(400).json({ message: 'FLIE EXISTS' })
            }
            else {
                const sql = `insert into myfile(parent_path,path,value,file,context,mtime,ctime)
                values (?,?,?,?,?,?,?)`
                let d = new Date()
                console.log(d)
                db.run(sql, ['/', string1, p[1], ftype, null, d, d], (err) => {
                    if (err) { res.json({ err: err }) }
                    else { res.status(200).json({ message: 'INSERTION SUCCESS' }) }
                })

            }
        })
    }

    else if (p.length > 2) {


        j = ''
        for (let i = 1; i < p.length - 1; i++) {
            j = j + '/' + p[i]
        }

        query = `select parent_path from myfile where path = '${string1}'`
        db.all(query, [], (err, rows) => {
            if (err) { return res.status(400).json({ err: err }) }
            else {
                console.log(rows.length)
                if ((rows.length > 0)) {
                    return res.status(400).json({ message: 'FLIE EXISTS' })
                }
                else {

                    query = `select * from myfile where path = '${j}'`
                    db.all(query, [], (err, rows) => {
                        if (err) {
                            return res.status(400).json({ err: err })
                        }
                        else {
                            if (rows.length == 0) {
                                return res.status(400).json({ message: 'PARENT DOES NOT EXISTS' })
                            }
                            else {
                                const sql = `insert into myfile(parent_path,path,value,file,context,mtime,ctime)
                            values (?,?,?,?,?,?,?)`
                                let d = new Date()
                                db.run(sql, [j, string1, p[p.length - 1], ftype, null, d, d], (err) => {
                                    if (err) { res.json({ err: err }) }
                                    else { res.status(200).json({ message: 'INSERTION SUCCESS' }) }
                                })
                            }
                        }
                    })


                }
            }

        })
    }
})

app.get('/getall', (req, res) => {
    const sql = `select * from myfile`
    db.all(sql, [], (err, rows) => {
        if (err) { console.log(err) }
        else {
            let m = []
            rows.forEach((row) => {
                m.push(row)
            })
            res.status(200).send(m)
        }
    })
})

app.post('/scan', (req, res) => {
    let key = req.body.key
    const sql = `select value from myfile where parent_path like '${key}%'`
    db.all(sql, [], (err, rows) => {
        if (err) { res.status(400).json({ err: err }) }
        else {
            let mem = []
            console.log(rows)
            console.log(rows.length)
            rows.forEach((row) => {
                mem.push(
                    row
                )
            })
            console.log(mem)
            res.status(200).send(mem)
        }
    })
})
app.post('/writefile', (req, res) => {
    let fpath = req.body.file_path;
    let content = req.body.content
    var query = `select file from myfile where path ='${fpath}'`
    db.all(query, [], (err, rows) => {
        if (err) { console.log(err) }
        else {
            console.log(rows)
            if (rows[0].file != 'file') {
                return res.status(400).json({ message: "The path cannot be written" })
            }

        }
    })
    console.log(fpath)
    console.log(content)
    let d = new Date()
    const sql = `update myfile set context='${content}' , mtime = '${d}' where path='${fpath}'`
    db.run(sql, [], (err) => {
        if (err) { res.status(400).json({ err: err }) }
        else {
            res.status(200).json({ message: 'WRITTEN' })
        }
    })

})
app.post('/readfile', (req, res) => {
    let fpath = req.body.file_path;

    var query = `select file from myfile where path ='${fpath}'`
    db.all(query, [], (err, rows) => {
        if (err) { return res.status(400).json({ message: 'CANNOT READ FILE' }) }
        else {
            if (rows[0].file != 'file') {
                return res.status(400).json({ message: "The path cannot be read" })
            }

        }
    })

    const sql = `select context from myfile where path = '${fpath}'`
    db.all(sql, [], (err, rows) => {
        if (err) { console.log(err) }
        else {
            let mem = []
            console.log(rows.length)
            rows.forEach((row) => {
                mem.push(row)
            })
            res.status(200).send(mem)
        }
    })

})
app.post('/deletefile', (req, res) => {
    let fpath = req.body.file_path;
    const sql = `delete from myfile where path like '${fpath}%'`
    db.all(sql, [], (err, rows) => {
        if (err) { res.status(400).json({ err: err }) }
        else {
            res.status(200).json({ message: 'DELETION SUCCESS' })
        }
    })

})
app.post('/rename', (req, res) => {
    let string1 = req.body.file_path
    let change = req.body.filename
    let t = string1
    let p = t.split('/')
    console.log(p) 
    if((change == '.') || (change == '..') || (/\\/g.test(change) != true) )
    {
        return res.status(400).json({err: 'The rename path is not accepted'})
    }
    else{
    if (p.length == 2) {
        console.log('entered')
        let d = new Date()
        const sql = `insert into myfile(parent_path,path,value,file,context,mtime,ctime)
    values (?,?,?,?,?,?)`
        db.run(sql, ['/', string1, p[1], 0, null, d, d], (err) => {
            if (err) { res.status(400).json({ err: err }) }
            else { res.status(200).json({ message: 'RENAME SUCCESS' }) }
        })

    }
    else {
        console.log('Not entered')
        j = ''
        for (let i = 1; i < p.length - 1; i++) {
            j = j + '/' + p[i]
        }
        k = j + '/' + change
        const sql = `insert into myfile(parent_path,path,value,file,context,mtime,ctime)
    values (?,?,?,?,?,?)`
        let d = new Date()
        db.run(sql, [j, k, change, 0, null, d, d], (err) => {
            if (err) { res.status(400).json({ err: err }) }
            else { res.status(200).json({ message: 'RENAME SUCCESS' }) }
        })
    }
}

})
app.post('/move', (req, res) => {
    let string2 = req.body.file_path
    let newpath1 = req.body.new_path
    console.log(string2)
    console.log(newpath1)
    let query
    query = `select * from myfile where path ='${string2}'`
    db.all(query, [], (err, rows1) => {
        if (err) {
            return res.status(400).res({ err: err })
        }
        else {
            console.log(rows1)
            if (rows1[0].file == 'file') {
                
                let p_path = rows1[0].parent_path
                let f_path = rows1[0].path
                let f_context = rows1[0].context
                let f_value = rows1[0].value
                console.log('------')
                console.log(f_value)
                console.log('------')
                let ctime = rows1[0].ctime

                console.log('entered in else')
                let t = string2
                let p = t.split('/')
                console.log(p.length)
                if (p.length == 2) {

                    console.log('length of 2')
                    query = `select * from myfile where path =  '${string2}'`
                    db.all(query, [], (err, rows) => {
                        if (err) {
                            return res.status(400).json({ err: err })
                        }
                        else if (rows) {

                            p_path = rows[0].parent_path
                            f_path = rows[0].path
                            f_context = rows[0].context
                            f_value = rows[0].value
                            let ctime = rows[0].ctime
                            let q1 = `delete from myfile where path = '${string2}'`
                            db.all(q1, [], (err) => {
                                if (err) { return res.status(400).json({ message: err }) }
                                else {
                                    console.log('DELETED')
                                }
                            })
                            console.log('the parent path :', p_path)
                            console.log('the file path:', f_path)
                            console.log('the context of file :', f_context)
                            console.log('the value of the file :', f_value)
                            const sql = `insert into myfile(parent_path,path,value,file,context,mtime,ctime)
                             values (?,?,?,?,?,?,?)`
                             console.log('------')
                console.log(f_value)
                console.log('------')
                            let npath = newpath1 + '/' + f_value
                            console.log('----------------------')
                            console.log(npath)
                            console.log('--------------')
                            let d = new Date()
                            db.run(sql, [newpath1, npath, f_value, 'file', f_context, d, ctime], (err) => {
                                if (err) { res.status(400).json({ err: err }) }
                                else { res.status(200).json({ message: 'MOVED SUCCESS' }) }
                            })

                        }
                        else {
                            return res.status(400).json({ message: 'File cannot be moved' })
                        }
                    })
                }
                else if (p.length > 2) {
                    console.log('length more than 2')
                    j = ''
                    for (let i = 1; i < p.length - 1; i++) {
                        j = j + '/' + p[i]
                    }
                    console.log(j)
                    
                    let query3 = `select * from myfile where path not like '${j}%' and path  ='${newpath1}'`
                    db.all(query3, [], (err, rows) => {
                        if (err) {
                            return res.status(400).json({ err: err })
                        }
                        else if (rows) {
                           

                            let q1 = `delete from myfile where path = '${string2}'`
                            db.all(q1, [], (err) => {
                                if (err) { return res.status(400).json({ message: err }) }
                                else {
                                    console.log('DELETED')
                                }
                            })
                            const sql = `insert into myfile(parent_path,path,value,file,context,mtime,ctime)
                            values (?,?,?,?,?,?,?)`
                            console.log('-hsbfkhjsdf-----')
                            console.log(f_value)
                            console.log('--sdfsfds----')
                           let npath = newpath1 + '/' + f_value
                           console.log('----------------------')
                           console.log(npath)
                           console.log('--------------')
                           let d = new Date()
                           db.run(sql, [newpath1, npath, f_value, 'file', f_context, d, ctime], (err) => {
                               if (err) { res.status(400).json({ err: err }) }
                               else { res.status(200).json({ message: 'MOVED SUCCESS' }) }
                           })


                        }
                        else {
                            return res.status(400).json({ message: 'File cannot be moved' })
                        }
                    })
                }
            }
            else {
                return res.status(400).json({ message: 'The given path is not a file' })
            }
        }
    })
})
app.post('/mtime',(req,res)=>{
    let fpath1 = req.body.file_path
    const sql = `select mtime from myfile where path='${fpath1}'`
    db.all(sql,[],(err,mtime)=>{
        if(err)
        {
            return res.status(400).json({message: 'Not able to get modified time'})
        }
        else
        {
            res.status(200).json({mtime})
        }
    })
})
app.post('/ctime',(req,res)=>{
    let fpath1 = req.body.file_path
    const sql = `select mtime from myfile where path='${fpath1}'`
    db.all(sql,[],(err,mtime)=>{
        if(err)
        {
            return res.status(400).json({message: 'Not able to get modified time'})
        }
        else
        {
            res.status(200).json({mtime})
        }
    })
})

let change = "asd\asdsd"
if(/\\/g.test(change) != true)
{
    console.log('it ois true')
}
else{
    console.log('it ois false')
}

app.listen(5000, () => {
    console.log('Started Listening to 5000')
})

