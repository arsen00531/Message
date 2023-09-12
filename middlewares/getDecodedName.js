module.exports = (cook) => {
    let cooki = cook.split(";")
    let name = ''
    for (let i = 0; i < cooki.length; i++) {
        let cookie = cooki[i];
        let eqPos = cookie.indexOf("=") + 1;
        let leng = cookie.length - eqPos
        name = eqPos > -1 ? cookie.substr(eqPos, leng) : cookie
    }
    console.log(name)
    return name
}