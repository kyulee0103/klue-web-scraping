const puppeteer = require('puppeteer')

async function login(page, username, password) {
    await page.goto('https://klue.kr/login')

    const idInputSelector = 'input[placeholder="아이디"].sc-iAKWXU'
    const passwordInputSelector = 'input[placeholder="비밀번호"].sc-iAKWXU'

    await page.waitForSelector(idInputSelector)
    await page.type(idInputSelector, username)

    await page.waitForSelector(passwordInputSelector)
    await page.type(passwordInputSelector, password)

    await page.click('button.sc-dPiLbb.bKLmRT')
    await page.waitForNavigation()
}

async function scrollDown(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0
            const distance = 100
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight
                window.scrollBy(0, distance)
                totalHeight += distance

                if (totalHeight >= scrollHeight) {
                    clearInterval(timer)
                    resolve()
                }
            }, 100)
        })
    })
}

async function getLectureData(page, searchKeyword) {
    await page.goto(`https://klue.kr/search?query=${encodeURIComponent(searchKeyword)}&sort=year_term`)
    await page.waitForSelector('ul.sc-ctqQKy.beRYOi')

    const firstResultSelector =
        'ul.sc-ctqQKy.beRYOi > div.infinite-scroll-component__outerdiv > div.infinite-scroll-component > li.sc-Galmp.dcEeYn:nth-child(1)'
    const firstResult = await page.$(firstResultSelector)

    if (firstResult) {
        await firstResult.click()

        let previousHeight = 0
        let currentHeight = await page.evaluate('document.body.scrollHeight')

        while (previousHeight !== currentHeight) {
            previousHeight = currentHeight
            await scrollDown(page)
            currentHeight = await page.evaluate('document.body.scrollHeight')
        }

        const data = await page.evaluate(() => {
            const userDivs = document.querySelectorAll(
                'div.infinite-scroll-component div.sc-cbTzjv.fouaZj div.sc-dwsnSq.dVqNXH',
            )
            const spanValues = Array.from(userDivs, (userDiv) => {
                const span = userDiv.querySelector('span')
                return span ? span.textContent.trim() : null
            })
            return spanValues.filter((value) => value !== null)
        })
        console.log(`${searchKeyword} 교수님 강의의 수강평을 남긴 학생들: ${data}`)
        return data
    } else {
        console.log(`${searchKeyword} 강의의 검색 결과가 없습니다. `)
        return []
    }
}

async function klueMain() {
    const browser = await puppeteer.launch({headless: 'new'})
    const page = await browser.newPage()
    const username = 'lllnnnyyy0110'
    const password = 'KUKUKU20@'

    await login(page, username, password)

    const searchKeywords = ['선물옵션 김태진', '경제학개론 김정현', '중급회계 유승경']

    const allData = []

    for (const searchKeyword of searchKeywords) {
        const data = await getLectureData(page, searchKeyword)
        allData.push(data)
    }

    const overlappingData = findOverlappingData(allData)
    if (overlappingData.length > 0) {
        console.log('3가지 강의의 수강평을 모두 남긴 닉네임:', overlappingData)
    } else {
        console.log('겹치는 닉네임이 존재하지 않습니다.')
    }

    await browser.close()
}

function findOverlappingData(dataArrays) {
    const overlappingData = []

    const baseData = dataArrays[0]
    for (const value of baseData) {
        const isOverlapping = dataArrays.every((data) => data.includes(value))
        if (isOverlapping) {
            overlappingData.push(value)
        }
    }
    return overlappingData
}

klueMain()
