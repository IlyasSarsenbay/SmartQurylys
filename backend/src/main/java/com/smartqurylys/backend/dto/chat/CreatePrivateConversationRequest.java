package com.smartqurylys.backend.dto.chat;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.Builder;

import jakarta.validation.constraints.NotNull;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreatePrivateConversationRequest {
    @NotNull(message = "ID целевого пользователя не может быть пустым")
    private Long targetUserId;

    private String name;
}
