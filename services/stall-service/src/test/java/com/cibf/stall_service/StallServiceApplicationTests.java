package com.cibf;

import com.cibf.service.StallService;
import com.cibf.repository.StallRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

@SpringBootTest
class StallServiceApplicationTests {

    @Autowired
    private StallService stallService;

   

    @Test
    void contextLoads() {
        // Passes if Spring can create StallService with mocked repository
    }
}
