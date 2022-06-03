import axios from 'https://cdn.skypack.dev/axios';
import _ from 'https://cdn.skypack.dev/lodash';

export async function main(parent) {
    let versions = [{
        label: 'Douay-Rheims Version, Challoner',
        key: 'drv'
    }]
    let bible;
    let book;
    let chapter;
    let book_verses;
    let chapter_verses;
    let token_index;
    let verse_index;

    let version_select = await element_select(
        parent, versions);
    element_on(version_select, 'change', on_version_change);

    async function on_version_change() {
        bible = (await axios.get(
            `https://wlj-bible-public.web.app/` + 
            `${element_select_value(version_select)}_parsed.json`)).data

        books_refresh();
    }

    let book_select = await element_select(
        parent, []);
    element_on(book_select, 'change', on_book_change);

    function books_refresh() {
        let books = _.uniq(_.map(bible, 'book'));
        element_select_update(book_select, books)
        on_book_change();
    }

    function on_book_change() {
        book = element_select_value(book_select);
        console.log({book})
        book_verses = _.filter(bible, {book});
        chapters_refresh();
    }

    let chapter_select = await element_select(
        parent, []);
    element_on(chapter_select, 'change', on_chapter_change);

    function chapters_refresh() {
        let chapters = _.uniq(_.map(book_verses, 'chapter'));
        element_select_update(chapter_select, chapters)
        on_chapter_change();
    }

    function on_chapter_change() {
        chapter = element_select_value(chapter_select);
        chapter_verses = _.filter(book_verses, {chapter});
        token_index = 0;
        verse_index = 0;
        verses_refresh();
    }

    let verses = element(parent, 'div');
    verses.style.maxHeight = '65vh'
    verses.style.overflowY = 'auto'
    function verses_refresh() {
        element_clear(verses);
        chapter_verses.forEach((v, v_index) => {
            let verse = element(verses, 'div');

            let number = element(verse, 'button');
            element_html_inner_set(number, v.verse);
            number.addEventListener('click', () => {
                verse_index = v_index;
                token_index = 0;
                verses_refresh();
            })

            let tokens = element(verse, 'span');
            v.tokens.forEach((t, t_index) => {
                element_spacer(tokens);

                let token = element(tokens, 'span');
                if (v_index === verse_index && t_index === token_index) {
                    token.style.backgroundColor = 'black'
                }
                if (v_index > verse_index ||
                    v_index === verse_index && t_index > token_index) {
                        token.style.color = 'gray'
                    }
                element_html_inner_set(token, t);
            })
        })
    }

    let keyboard = element(parent, 'div');
    let keys = [
        'qwertyuiop',
        'asdfghjkl',
        'zxcvbnm'
    ]
    keys.forEach(row => {
        let keyboard_row = element(keyboard, 'div');
        keyboard_row.style.textAlign = 'center'

        row.split('').forEach(k => {
            let key = element(keyboard_row, 'button');
            key.style.padding = '2vw';
            element_html_inner_set(key, k.toUpperCase());

            key.addEventListener('click', () => {
                const verse_tokens = chapter_verses[verse_index].tokens;
                let expected = verse_tokens[token_index][0].toLowerCase();

                if (k === expected) {
                    token_index++;

                    if (token_index >= verse_tokens.length) {
                        verse_index++;
                        token_index = 0;
                    }

                    verses_refresh();
                }
            })
        })
    })

    await on_version_change();
}

function element_spacer(parent) {
    let spacer = element(parent, 'span');
    element_html_inner_set(spacer, ' ');
}

function element_select_value(select) {
    return select.options[select.selectedIndex].value;
}

function element_on(element, event_name, on_event) {
    element.addEventListener(event_name, on_event);
}

function element_select(parent, versions) {
    let select = element(parent, 'select');
    return element_select_update(select, versions);
}

function element_select_update(select, versions) {
    element_clear(select);
    versions.forEach(version => {
        let option = element(select, 'option');
        element_html_inner_set(option, version.label || version);
        element_attribute_set(option, 'value', version.key || version);
    });
    return select;
}

function element_clear(element) {
    element.innerHTML = '';
}

export function element_attribute_set(element, attribute, value) {
    element.setAttribute(attribute, value);
}

export function element_html_inner_set(element, text) {
    element.innerHTML = text;
}

export function element(parent, tag_name) {
    let result = document.createElement(tag_name);
    parent.appendChild(result);
    return result;
}