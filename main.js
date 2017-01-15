const http    = require('http'),
      Bot     = require('node-telegram-bot-api'),
      mongodb = require('mongodb')

var num = 1
var titles
var summaries
var images
var dates
var home_url 
var sendType
var collectionUsers
var collectionNews

const MongoClient = mongodb.MongoClient
const url = 'mongodb://mah:!193M71i5@jello.modulusmongo.net:27017/it9ubEqe'
const bot = new Bot('328570988:AAF7h6EPFIGl_UUwyy07dyEMbHy6f5RTIpQ', {polling: true})




function startbot () {
    MongoClient.connect(url, (err, db) => {
        if (err) {
            console.log('unable to connect to the server. try agine...')
            return startbot()
        }
        else {
            console.log(`connect established to ${url}`)
            
            collectionUsers = db.collection('users')
            collectionNews = db.collection('news')
            
            bot.on('message', (message) => {
                console.log(message)
                var Mtext = message.text
                switch (Mtext) {
                    case '/start':
                        bot.sendMessage(message.chat.id, `hello ${message.chat.first_name}`)
                        collectionUsers.find({_id: message.chat.id}).toArray((err, result) => {
                                if (err) {console.log(err)}
                                else if (result.length) {
                                    console.log('finded')
                                }
                                else {
                                    console.log('not found')
                                    sendType = 1
                                    collectionUsers.insertOne({_id: message.chat.id, name: message.chat.first_name, username: message.chat.username})
                                    getNews(sendType, message)
                                }
                            })
                        break;
                    case 'ایرنا':
                        bot.sendMessage(message.chat.id, 'please wait...')
                        console.log('irna')
                        sendType = 1
                        home_url = 'http://www.irna.ir'
                        getNews(sendType, message)
                        break;
                    case 'ایسنا':
                        break;
                    default:
                        
                }
            })
        }
    })
}


function sliceContent (text, parent, start, end) {
    var result = []
    var x = 0
    while (1) {
        x = text.indexOf(parent, x) + parent.length
        console.log(x)
        if (x === parent.length - 1) break
        x = text.indexOf(start, x) + start.length
        console.log(x)
        result.push(text.slice(x, text.indexOf(end, x)))
    }
    return result
} 

function remove (text= '', first= '', end= '') {
    var txt
    var FirstIndex = 0
    while (text.indexOf(first) != -1) {
        FirstIndex = text.indexOf(first, FirstIndex)
        txt = text.slice(FirstIndex, text.indexOf(end, FirstIndex)+1)
        text = text.replace(txt, '')
    }
    return text
}

function getNews(sendType, message) {
    http.get(home_url, (res) => {
        var rawdata
        var id
        res.on('data', (chunk) => rawdata += chunk)
        res.on('end', () => {
            titles = sliceContent(rawdata, 'class="LiTopNews"', '"', '-')
            summaries = sliceContent(rawdata, 'class="LiTopNews"', '<p>', '</p>')
            images = sliceContent(rawdata, 'class="LiTopNews"', "original='", "'")
            urls = sliceContent(rawdata, 'class="LiTopNews"', 'href="', '"')
            dates = sliceContent(rawdata, 'class="LiTopNews"', '-', '"')
            console.log('urls\n', urls,'\n')
            //--------------------------
            urls.forEach((item, index) => {
                collectionNews.find({_id: item}).toArray((err, result) => {
                    if (err) console.log('error', err)
                    else if (result.length) console.log('found', index)
                    else {
                        console.log('not found', index)
                        //collectionNews.insertOne({_id: item})
                        if (sendType === 1) {
                            console.log('type 1')
                            id = message.chat.id
                            console.log(id,'-', index)
                            sendNews(id, index)
                        }
                        else {
                            console.log('type 2')
                            collectionUsers.find({}).toArray((err, result) => {
                                result.forEach(sendNews(item._id, index))
                            })
                        }  
                    }
                })  
            }) 
        })
    }).on('error', (e) => {
        console.log('error out', e.message)
        return getNews(sendType, message)
    })
}

function sendNews (id, index) {
    setTimeout(() => {
        bot.sendPhoto(id, images[index], {
            caption: `${titles[index]} . ادامه ی خبر 👇`
        })
        bot.sendMessage(id, `${summaries[index]} \n ---------------`)
        console.log('finish')
    },100)
}


startbot()