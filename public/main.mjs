import axios from 'https://cdn.skypack.dev/axios';
import _ from 'https://cdn.skypack.dev/lodash';

export async function main(parent, bible_override) {
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
    let errors;

    let version_select = await element_select(
        parent, versions);
    element_on(version_select, 'change', on_version_change);

    if (bible_override) {
        version_select.style.display = 'none'
    }

    async function on_version_change() {
        if (bible_override) {
            bible = bible_override
        } else {
            bible = (await axios.get(
                `https://wlj-bible-public.web.app/` + 
                `${element_select_value(version_select)}_parsed.json`)).data
        }

        books_refresh();
    }

    let book_select = await element_select(
        parent, []);
    element_on(book_select, 'change', on_book_change);

    function books_refresh() {
        let books = _.uniq(_.map(bible, 'book'));
        element_select_update(book_select, books);
        local_storage_select_value_set(book_select, 'book');
        on_book_change();
    }

    function local_storage_select_value_set(select, key) {
        let value = localStorage.getItem(key);
        console.log(local_storage_select_value_set.name, {key,value})
        if (_.isString(value)) {
            select.value = value;
        }
    }

    function on_book_change() {
        book = element_select_value(book_select);
        book_verses = _.filter(bible, {book});
        chapters_refresh();

        local_storage_item_set('book', book);
    }

    function local_storage_item_set(key, value) {
        localStorage.setItem(key, value);
    }

    let chapter_select = await element_select(
        parent, []);
    element_on(chapter_select, 'change', on_chapter_change);

    function chapters_refresh() {
        let chapters = _.uniq(_.map(book_verses, 'chapter'));
        element_select_update(chapter_select, chapters)
        local_storage_select_value_set(chapter_select, 'chapter');
        on_chapter_change();
    }

    let partition_select = await element_select(
        parent, []);
    element_on(partition_select, 'change', on_partition_change);
    function on_partition_change() {
        partition_select_changed();
        verses_refresh();

        let partition = element_select_value(partition_select);
        local_storage_item_set('partition', partition);

    }
    let array_partition_max_size = 2;
    let partitioned;
    let partitions;
    function on_chapter_change() {
        chapter = element_select_value(chapter_select);
        chapter_verses = _.filter(book_verses, {chapter});
        partitioned = array_partition(chapter_verses, array_partition_max_size);
        partitions = Array.from(array_partition_flatten(partitioned));
        element_select_update(partition_select, partitions.map((p, index) => {
            return {
                label: _.first(p).verse + '-' + _.last(p).verse,
                key: index
            }
        }))
        local_storage_select_value_set(partition_select, 'partition');
        partition_select_changed();

        errors = {};
        token_index = 0;
        verse_index = 0;
        verses_refresh();

        local_storage_item_set('chapter', chapter);
    }

    let pattern_1 = [
        '1', 
        '1110', 
        '1101', 
        '1011', 
        '0111', 
        '10', 
        '01', 
        '100', 
        '1001000', 
        '10000',
        '0', 
        '0', 
        '0'
    ];

    let pattern_select = await element_select(
        parent, pattern_1);
    element_on(pattern_select, 'change', on_pattern_change);
    
    function on_pattern_change() {
        errors = {};
        verses_refresh();

        let pattern = element_select_value(pattern_select);
        local_storage_item_set('pattern', pattern);
    }

    function partition_current_get() {
        const partition_select_index =
             _.parseInt(element_select_value(partition_select)) || 0;
        return partitions[partition_select_index]
    }

    let verses_tokens;
    let verses_elements;

    let verses = element(parent, 'div');
    let height = '52vh';
    verses.style.maxHeight = height
    verses.style.minHeight = height
    verses.style.overflowY = 'auto'
    function verses_refresh() {
        let token_total_index = 0;
        element_clear(verses);
        verses_tokens = [];
        verses_elements = [];
        let pattern = pattern_get();
        partition_current_get().forEach((v, v_index) => {
            let verse = element(verses, 'div');
            verses_tokens.push([]);
            verses_elements.push(verse);
            let number = element(verse, 'button');
            element_html_inner_set(number, v.verse);
            number.addEventListener('click', () => {
                verse_index = v_index;
                token_index = 0;
                errors = {};
                verses_refresh();
                element_scroll_into_view_vertically_centered(verses_elements[verse_index])
            })

            let tokens = element(verse, 'span');
            v.tokens.forEach((t, t_index) => {
                element_spacer(tokens);

                let token = element(tokens, 'span');
                token.style.touchAction = 'manipulation'
                token.dataset.tokenTotalIndex = token_total_index;
                _.last(verses_tokens).push(token);

                token_color_update(pattern, token, v_index, t_index);
                element_html_inner_set(token, t);

                token_total_index++;
            })
        })
    }

    function token_color_update(pattern, token, v_index, t_index) {
        let is_hidden = pattern[token.dataset.tokenTotalIndex % pattern.length] === '0';
        let is_error = errors[error_index_get(v_index, t_index)];

        token.style.backgroundColor = 'white'
        token.style.color = 'black'
        if (is_error) {
            token.style.color = 'red';
        }
        if (v_index === verse_index && t_index === token_index) {
            token.style.backgroundColor = is_error ? 'red' : 'black';
            token.style.color = 'white';
            if (is_hidden) {
                if (!is_error) {
                    token.style.color = 'black';
                }
            }
        }
        if (v_index > verse_index ||
            v_index === verse_index && t_index > token_index) {
            token.style.color = 'gray';

            if (is_hidden) {
                let color = 'lightgray';
                if (element_select_value(pattern_select) === '0') {
                    color = 'white';
                }
                token.style.color = color;
                token.style.backgroundColor = color;
            }
        }
    }

    function pattern_get() {
        return element_select_value(pattern_select).split('');
    }

    function error_index_get(verse_index, token_index) {
        return verse_index + '-' + token_index;
    }

    let keyboard = element(parent, 'div');
    let keys = [
        'qwertyuiop',
        'asdfghjkl',
        'zxcvbnm'
    ];
    // keys = [keys.join("")]
    keys.forEach(row => {
        let keyboard_row = element(keyboard, 'div');
        keyboard_row.style.textAlign = 'center'

        row.split('').
        // sort().
        forEach(k => {
            let key = element(keyboard_row, 'button');
            key.style.paddingTop = '2vw';
            key.style.paddingBottom = '2vw';
            key.style.paddingLeft = '2.5vw';
            key.style.paddingRight = '2.5vw';
            key.style.fontSize = '5vw'
            element_html_inner_set(key, k.toUpperCase());

            key.addEventListener('mousedown', () => {
                on_key(k);
            })
        })
    })
    
    document.addEventListener('keydown', (event) => {
        event.preventDefault();
        var name = event.key;
        on_key(name);
    }, false);

    await on_version_change();

    let alphabet = keys.join("");
    function js_string_remove_all_except(s, characters_to_keep) {
        let result = "";
        for (let a of s) {
            if (characters_to_keep.includes(a)) {
                result += a;
            }
        }
        return result;
    }

    function on_key(k) {
        const verse_tokens = partition_current_get()[verse_index].tokens;
        const verse_token = verse_tokens[token_index].toLowerCase();
        let verse_token_removed = js_string_remove_all_except(
            verse_token,
            alphabet
        );
        let expected = verse_token_removed[0];

        let token_index_before = token_index;
        let verse_index_before = verse_index;

        let refresh = false;
        if (!key_is_near(k, expected)) {
            errors[error_index_get(verse_index, token_index)] = true;
        } else {
            token_index++;

            if (token_index >= verse_tokens.length) {
                verse_index++;
                token_index = 0;

                if (verse_index >= partition_current_get().length) {
                    refresh = true;

                    verse_index = 0;

                    let repeat = false;
                    if (element_select_value(pattern_select) === '0') {
                        if (_.keys(errors).length > 0) {
                            repeat = true;
                        }
                    }

                    errors = {};
                    if (!repeat) {
                        element_index_selected_increment(pattern_select);

                        if (pattern_select.selectedIndex < 0) {
                            pattern_select.selectedIndex = 0;

                            element_index_selected_increment(partition_select);
                            partition_select_changed();
                        }
                    }
                }
            }
        }

        element_scroll_into_view_vertically_centered(verses_elements[verse_index]);

        // refresh = true;
        if (refresh) {
            verses_refresh();
        } else {
            let pattern = pattern_get();

            let token_before = verses_tokens[verse_index_before][token_index_before];
            token_color_update(pattern, token_before, verse_index_before, token_index_before);

            let token = verses_tokens[verse_index][token_index];
            token_color_update(pattern, token, verse_index, token_index);
        }
    }

    function partition_select_changed() {
        errors = {};
        token_index = 0;
        verse_index = 0;
        if (partition_current_get().length >= array_partition_max_size * 2) {
            const pattern_2 = [
                '1', 
                '110', 
                '11010', 
                '10', 
                '01', 
                '100', 
                '1000',
                '10000',
                '0', 
                '0', 
                '0'
            ];
            element_select_update(pattern_select, pattern_2);
        } else {
            element_select_update(pattern_select, pattern_1);
        }
        local_storage_select_value_set(pattern_select, 'pattern');
        if (pattern_select.selectedIndex < 0) {
            pattern_select.selectedIndex = 0;
        }
    }
}

function element_scroll_into_view_vertically_centered(element) {
    element.scrollIntoView({block:'center'})
}

let key_is_near_mapping = {
    'q': 'wa',
    'w': 'qase',
    'e': 'wsdr',
    'r': 'edft',
    't': 'rfgy',
    'y': 'tghu',
    'u': 'yhji',
    'i': 'ujko',
    'o': 'iklp',
    'p': 'ol',
    'a': 'qwsz',
    's': 'awedxz',
    'd': 'serfcx',
    'f': 'drtgvc',
    'g': 'ftyhbv',
    'h': 'gyujnb',
    'j': 'huikmn',
    'k': 'jiolm',
    'l': 'kop',
    'z': 'asx',
    'x': 'zsdc',
    'c': 'xdfv',
    'v': 'cfgb',
    'b': 'vghn',
    'n': 'bhjm',
    'm': 'njk',
}
function key_is_near(k, expected) {
    return key_is_near_mapping[k].split('').concat(k).includes(expected)
}

function element_index_selected_increment(element) {
    element.selectedIndex = element.selectedIndex + 1;
}

// console.log(JSON.stringify(array_partition([1,2,3,4,5,6,7,8], 3)));
// console.log(Array.from(array_partition_flatten(array_partition([1,2,3,4,5,6,7,8], 3) )))

function *array_partition_flatten(partitioned) {
    for (let child of partitioned) {
        if (_.isArray(child)) {
            for (let g of array_partition_flatten(child)) {
                yield g;
            }
        } else {
            //yield child;
        }
    }
    yield _.flattenDeep(partitioned)
}

function array_partition(array, min_size) {
    let result = [];
    if (array.length >= min_size * 2) {
        let middle = Math.floor(array.length / 2);
        let left = array.slice(0, middle);
        let right = array.slice(middle);
        result.push(array_partition(left, min_size));
        result.push(array_partition(right, min_size));
    } else {
        result = array;
    }
    return result;
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
