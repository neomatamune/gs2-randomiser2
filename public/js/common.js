function setLangCookie(lang) {
    let date = new Date();
    date.setTime(date.getTime() + 2592000000);
    document.cookie = `lang=${lang};expires=${date.toUTCString()};path=/`
}

function getLangPath(lang) {
    let path = window.location.pathname;
    if (path.startsWith('/en/') || path.startsWith('/de/') || path.startsWith('/fr/') || path.startsWith('/es/')) {
        path = path.substring(3);
    }

    console.log("Path: "  + path)
    if (path.length == 0)
        path += "/index.html";
    if (path.length == 1)
        path += "index.html";

    return `/${lang}${path}`;
}

$(document).ready(() => {
    $("#lang-en").click(() => {
        setLangCookie("en");
        window.location = getLangPath("en");
    });

    $("#lang-de").click(() => {
        setLangCookie("de");
        window.location = getLangPath("de");
    });

    $("#lang-fr").click(() => {
        setLangCookie("fr");
        window.location = getLangPath("fr");
    });

    $("#lang-es").click(() => {
        setLangCookie("es");
        window.location = getLangPath("es");
    });
});