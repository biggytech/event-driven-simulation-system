const { Model } = require('./model');

const prompt = require('prompt-sync')();

// Исходные данные
let lambda = 0.32;
let mu = 0.3;
let T = 260;
let m = 42;
let n = 90; // число прогонов

console.log('Введите исходные данные, разделенные пробелом');
console.log('--- введите 0 для использования предустановленных параметров ---');
const input = prompt('λ μ T m Число_прогонов: ');

if (input !== '0') {
    const [
        _lambda,
        _mu,
        _T,
        _m,
        _n
    ] = input.split(' ');

    lambda = Number(_lambda);
    mu = Number(_mu);
    T = Number(_T);
    m = Number(_m);
    m = Number(_n); // число прогонов
}

// Суммы всех показателей
let total_incomed = 0;
let total_processed = 0;
let total_declined = 0;
let total_declined_after_finish = 0;
let total_downtime = 0;

// Данные для расчета дисперсий
const arr_incomed = [];
const arr_processed = [];
const arr_declined = [];
const arr_declined_after_finish = [];
const arr_downtime = [];

// Имитационные прогоны
for (let i = 0; i < n; i++) {
    const model = new Model({ lambda, mu, T, m });
    const {
        incomed, // 1)	w1 – число заявок, поступивших в систему;
        processed, // 2)	w2 – число заявок, обслуженных системой;
        declined, // 3)	w3 – число заявок, потерянных вследствие переполнения СТЕКа вычислительной системы;
        declined_after_finish, // w4 – число потерянных заявок, оставшихся в СТЕКе после окончания Т моделирования;
        downtime // 7)	Тпр – время простоя процессора.
    } = model.run();

    total_incomed += incomed;
    total_processed += processed;
    total_declined += declined;
    total_declined_after_finish += declined_after_finish;
    total_downtime += downtime;

    arr_incomed.push(incomed);
    arr_processed.push(processed);
    arr_declined.push(declined);
    arr_declined_after_finish.push(declined_after_finish);
    arr_downtime.push(downtime);

    if (i === n-1) {
        // Вывести данные о последнем прогоне
        console.log('-- Пример данных для последнего прогона --');
        console.table([
            ['Поступивших', incomed],
            ['Обработанных', processed],
            ['Потерянных', declined],
            ['Потерянных в стеке', declined_after_finish],
            ['Время простоя', downtime],
        ])
    }
}

// Рассчет средних значений
const avg_incomed = total_incomed / n;
const avg_processed = total_processed / n;
const avg_declined = total_declined / n;
const avg_declined_after_finish = total_declined_after_finish / n;
const avg_downtime = total_downtime / n;

// Расчет дисперсий
const disp_incomed = arr_incomed.map(value => {
    return Math.pow(avg_incomed - value, 2);
}).reduce((sum, value) => sum + value, 0) / (n - 1);
const disp_processed = arr_processed.map(value => {
    return Math.pow(avg_processed - value, 2);
}).reduce((sum, value) => sum + value, 0) / (n - 1);
const disp_declined = arr_declined.map(value => {
    return Math.pow(avg_declined - value, 2);
}).reduce((sum, value) => sum + value, 0) / (n - 1);
const disp_declined_after_finish = arr_declined_after_finish.map(value => {
    return Math.pow(avg_declined_after_finish - value, 2);
}).reduce((sum, value) => sum + value, 0) / (n - 1);
const disp_downtime = arr_downtime.map(value => {
    return Math.pow(avg_downtime - value, 2);
}).reduce((sum, value) => sum + value, 0) / (n - 1);

// Вероятности
const processed_prob = total_processed / total_incomed;
const declined_prob = (total_declined + total_declined_after_finish) / total_incomed;

// Вывод результатов
console.table([
    ['среднее число поступивших в систему заявок', avg_incomed.toFixed(2)],
    ['дисперсия поступивших в систему заявок', disp_incomed.toFixed(2)],
    ['среднее число обслуженных заявок', avg_processed.toFixed(2)],
    ['дисперсия обслуженных заявок', disp_processed.toFixed(2)],
    ['среднее число потерянных заявок', avg_declined.toFixed(2)],
    ['дисперсия потерянных заявок', disp_declined.toFixed(2)],
    ['среднее число потерянных заявок, оставшихся в стеке', avg_declined_after_finish.toFixed(2)],
    ['дисперсия потерянных заявок, оставшихся в стеке', disp_declined_after_finish.toFixed(2)],
    ['статистическая вероятность обслуживания задания', processed_prob.toFixed(2)],
    ['статистическая вероятность отказа в обслуживании задания', declined_prob.toFixed(2)],
    ['среднее время простоя процессора', avg_downtime.toFixed(2)],
    ['дисперсия время простоя процессора', disp_downtime.toFixed(2)],
]);
