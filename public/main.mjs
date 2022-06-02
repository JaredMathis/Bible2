import axios from 'https://cdn.skypack.dev/axios';
import _ from 'https://cdn.skypack.dev/lodash';

export async function main(parent) {
    let versions = [{
        label: 'Douay-Rheims Version, Challoner Revision',
        key: 'drv'
    }]
    let bible;
    let books;

    let {select} = await element_select_on_change(
        parent, versions, on_version_change);
    let books_container = element(parent, 'div');

    async function on_version_change(select) {
        bible = (await axios.get(
            `https://wlj-bible-public.web.app/` + 
            `${element_select_value(select)}_parsed.json`)).data
        books = _.uniq(_.map(bible, 'book'));
        await books_refresh();
    }

    async function books_refresh() {
        let {select} = await element_select_on_change(
            books_container, books, on_book_change);
        async function on_book_change(select) {

        }
    }

    await on_version_change(select);
}

async function element_select_on_change(parent, choices, on_change) {
    let {select} = element_select(parent, choices);
    element_on(select, 'change', on_change)
    return {select}
}

function element_select_value(select) {
    return select.options[select.selectedIndex].value;
}

function element_on(element, event_name, on_event) {
    element.addEventListener(event_name, on_event);
}

function element_select(parent, versions) {
    let select = element(parent, 'select');
    versions.forEach(version => {
        let option = element(select, 'option');
        element_html_inner_set(option, version.label || version);
        element_attribute_set(option, 'value', version.key || version);
    });
    return {
        select
    }
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