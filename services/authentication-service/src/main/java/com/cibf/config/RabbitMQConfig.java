package com.cibf.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String RESERVATION_QUEUE = "reservation.queue";
    public static final String EMAIL_QUEUE = "email.queue";
    public static final String QR_QUEUE = "qr.queue";
    public static final String NOTIFICATION_QUEUE = "notification.queue";

    public static final String RESERVATION_EXCHANGE = "reservation.exchange";

    public static final String RESERVATION_CONFIRMED_KEY = "reservation.confirmed";
    public static final String RESERVATION_CANCELLED_KEY = "reservation.cancelled";
    public static final String EMAIL_SEND_KEY = "email.send";
    public static final String QR_GENERATE_KEY = "qr.generate";
    public static final String NOTIFICATION_SEND_KEY = "notification.send";

    public static final String DLX_EXCHANGE = "dlx.exchange";
    public static final String DLQ_QUEUE = "dlq.queue";

    @Bean
    public Queue reservationQueue() {
        return QueueBuilder.durable(RESERVATION_QUEUE)
                .withArgument("x-dead-letter-exchange", DLX_EXCHANGE)
                .withArgument("x-dead-letter-routing-key", "dlq")
                .build();
    }

    @Bean
    public Queue emailQueue() {
        return QueueBuilder.durable(EMAIL_QUEUE)
                .withArgument("x-dead-letter-exchange", DLX_EXCHANGE)
                .withArgument("x-dead-letter-routing-key", "dlq")
                .build();
    }

    @Bean
    public Queue qrQueue() {
        return QueueBuilder.durable(QR_QUEUE)
                .withArgument("x-dead-letter-exchange", DLX_EXCHANGE)
                .withArgument("x-dead-letter-routing-key", "dlq")
                .build();
    }

    @Bean
    public Queue notificationQueue() {
        return QueueBuilder.durable(NOTIFICATION_QUEUE)
                .withArgument("x-dead-letter-exchange", DLX_EXCHANGE)
                .withArgument("x-dead-letter-routing-key", "dlq")
                .build();
    }

    @Bean
    public Queue deadLetterQueue() {
        return QueueBuilder.durable(DLQ_QUEUE).build();
    }

    @Bean
    public TopicExchange reservationExchange() {
        return new TopicExchange(RESERVATION_EXCHANGE);
    }

    @Bean
    public DirectExchange deadLetterExchange() {
        return new DirectExchange(DLX_EXCHANGE);
    }

    @Bean
    public Binding reservationBinding() {
        return BindingBuilder
                .bind(reservationQueue())
                .to(reservationExchange())
                .with(RESERVATION_CONFIRMED_KEY);
    }

    @Bean
    public Binding reservationCancelledBinding() {
        return BindingBuilder
                .bind(reservationQueue())
                .to(reservationExchange())
                .with(RESERVATION_CANCELLED_KEY);
    }

    @Bean
    public Binding emailBinding() {
        return BindingBuilder
                .bind(emailQueue())
                .to(reservationExchange())
                .with(EMAIL_SEND_KEY);
    }

    @Bean
    public Binding qrBinding() {
        return BindingBuilder
                .bind(qrQueue())
                .to(reservationExchange())
                .with(QR_GENERATE_KEY);
    }

    @Bean
    public Binding notificationBinding() {
        return BindingBuilder
                .bind(notificationQueue())
                .to(reservationExchange())
                .with(NOTIFICATION_SEND_KEY);
    }

    @Bean
    public Binding deadLetterBinding() {
        return BindingBuilder
                .bind(deadLetterQueue())
                .to(deadLetterExchange())
                .with("dlq");
    }

    @Bean
    public MessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(messageConverter());
        return template;
    }
}