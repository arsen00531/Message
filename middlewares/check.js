module.exports = (cooki, jwt) => {
    let name = null
    cooki.split(';').forEach((value) => {
        const decoded = jwt.decode(value.split('=')[1])
		if (decoded != null) name = decoded
	})

    return name
}