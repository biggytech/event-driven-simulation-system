class Model {
    /**
     * Исходные данные
     */
    lambda = 0; // параметр закона поступления
    mu = 0; // параметр закона выполнения
    T = 0; // ограничение на время выполнения
    m = 0; // емкость стека

    // Количество заявок в запоминающем устройстве x1(t) <= m
    waiting_count = 0;
    // Индикатор состояния процессора x2(t)
    busy = false;
    // текущий момент времени t(r)
    current_time = 0;
    // момент поступления следующего события t(1)
    next_arrival_time = 0;
    // момент завершения обработки текущего запущенного события t(2)
    processing_finish_time = Infinity;
    // фактическое время завершения работы системы (>= T)
    termination_time = 0;

    /**
     * Данные результата
     */
    incomed = 0; // 1)	w1 – число заявок, поступивших в систему;
    processed = 0; // 2)	w2 – число заявок, обслуженных системой;
    declined = 0; // 3)	w3 – число заявок, потерянных вследствие переполнения СТЕКа вычислительной системы;
    declined_after_finish = 0; // w4 – число потерянных заявок, оставшихся в СТЕКе после окончания Т моделирования;
    downtime = 0; // 7)	Тпр – время простоя процессора.

    constructor({lambda, mu, T, m }) {
        this.lambda = lambda;
        this.mu = mu;
        this.T = T;
        this.m = m;
    }

    /**
     * Запустить симуляцию
     */
    run() {
        let is_first_request = true;

        // первое событие A(0)
        this.set_next_arrival_time();
        // пока процессор ждет первой заявки - это время простоя
        this.downtime = this.next_arrival_time;
        // ... якобы тут процессор наконец дождался первой заявки
        // обновление текущего времени
        this.current_time = this.next_arrival_time;

        // начинаем обработку заявок
        while (this.current_time < this.T) {
            if (this.next_arrival_time < this.processing_finish_time) {
                if (is_first_request) {
                    this.incomed++;
                    // первая заявка сразу же отправляется на процессинг
                    this.start_immediate_processing();
                    is_first_request = false;
                } else {
                    // добавление заявки
                    this.add_incoming_request();
                }
            } else if (this.processing_finish_time < this.next_arrival_time) {
                // завершение обработки текущей активной заявки
                this.finish_current_processing();
            } else {
                // время наступления событий равно
                // сперва завершаем обработку текущей заявки
                this.finish_current_processing();
                // затем добавляем новую заявку
                this.add_incoming_request();
            }

            // обновление текущего времени
            this.current_time = Math.min(this.processing_finish_time, this.next_arrival_time, this.T);
        }

        // обработка оставшейся на выполнении заявки
        if (this.busy) {
            // обработка оставшейся заявки
            this.terminate_current_processing();
        }

        // вывод результатов
        return {
            incomed: this.incomed, // 1)	w1 – число заявок, поступивших в систему;
            processed: this.processed, // 2)	w2 – число заявок, обслуженных системой;
            declined: this.declined, // 3)	w3 – число заявок, потерянных вследствие переполнения СТЕКа вычислительной системы;
            declined_after_finish: this.declined_after_finish, // w4 – число потерянных заявок, оставшихся в СТЕКе после окончания Т моделирования;
            downtime: this.downtime, // 7)	Тпр – время простоя процессора.
        }
    }

    // #region Основные методы обработки
    // Мгновенный старт обработки заявки
    start_immediate_processing() {
        this.busy = true;
        // рассчет времени завершения ее обработки
        this.set_processing_finish_time();
        // рассчет времени поступления следующей заявки
        this.set_next_arrival_time();
    }

    // добавление новых заявок
    add_incoming_request() {
        this.incomed++;
        
        if (!this.busy) {
            // процессор свободен, сразу же начинаем обработку
            this.start_immediate_processing();
        } else {
            // процессор занят
            if (this.waiting_count < this.m) {
                // добавляем заявку в ожидающие
                this.waiting_count++;
            } else {
                // места в ожидании нет, заявка потеряна
                this.declined++;
            }
            // рассчет времени поступления следующей заявки
            this.set_next_arrival_time();
        }
    }

    // завершение обработки активной заявки
    finish_current_processing() {
        this.processed++;

        if (this.waiting_count > 0) {
            // берем следующую заявку на выполнение
            this.waiting_count--;
            // рассчет времени завершения ее обработки
            this.set_processing_finish_time();
        } else {
            // процессор становится незанятым
            this.busy = false;
            this.processing_finish_time = Infinity;
            // это фактически время простоя до следующей входящей заявки
            this.downtime += (this.next_arrival_time - this.current_time);
        }
    }

    // завершение обработки последней заявки и отказ от дальнейшего обслуживания
    terminate_current_processing() {
        this.processed++;
        this.busy = false;
        this.termination_time = this.processing_finish_time;
        this.declined_after_finish = this.waiting_count;
    }
    // #endregion

    // #region Вспомогательные функции
    /**
     * Метод обратной функции для генерации непрерывной СВ
     * (для генерации интервалов времени поступления и обс-я заявок)
     */
    get_random_time_interval(parameter) {
        return -((1/parameter) * Math.log(1 - Math.random()));
    }

    // установка момента времени прибытия следующей заявки
    set_next_arrival_time() {
        this.next_arrival_time = this.current_time + this.get_random_time_interval(this.lambda);
    }

    // установка момента времени завершения обработки текущей активной заявки
    set_processing_finish_time() {
        this.processing_finish_time = this.current_time + this.get_random_time_interval(this.mu);
    }
    // #endregion
}

module.exports = { Model };
